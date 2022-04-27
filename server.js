const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const DeltaConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
// const http = require('http')
const bodyParser = require('body-parser')
const uuid = require('uuid');
const cors = require('cors');
// const JSON5 = require('json5')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()
const connection = require('./db.js')
const { User, validate } = require('./models/user')
const { Doc } = require('./models/doc')
const download = require('image-downloader')
const { v4 } = require('uuid');
const MongoShareDB = require('sharedb-mongo');
const multer = require('multer')

var mediaid = ""
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images')
  },
  filename: function (req, file, cb) {
    let error = (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') ? null : new Error("Incorrect File type")
    let type = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
    mediaid = v4()
    console.log("downloading image")
    imgDict[mediaid] = type
    cb(error, `${mediaid}.${type}`)
  }
})
var upload = multer({ storage: storage }).single('file')

const PORT = 8080;
const app = express()
// const server = http.createServer(app)
// const wss = new WebSocket.Server({ server: server })

// For image/file limit
// app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }))
// app.use(bodyParser.json())

app.use(cors({ credentials: true }))
// app.use(express.json())
app.use(express.urlencoded({ extended: true}));
app.use(express.json())
app.use(cookieParser())
// Set up cookies
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

let connections = [] // uid : res
let docDict = {} // docid: set(uid)
let imgDict = {}
// after submitop, go thru list of uid for that doc, res.write


// Nodemailer with Postfix
let transporter = nodemailer.createTransport({
    service: 'postfix',
    host: 'localhost',
    port: 25,
    auth: { user: 'root@googledocs-m2', pass: '' },
    tls: { rejectUnauthorized: false },
    name: 'root@googledocs-m2'
  });

// Mongoose setup
mongoose.Promise = global.Promise;
(async () => await connection())();

// ShareDB + Mongo set up
const db = mongoose.connection
ShareDB.types.register(require('rich-text').type); // type registration, rich text is like bold, italic, etc

const docDB = MongoShareDB('mongodb+srv://andrew:andrewge@cluster0.f9prs.mongodb.net/main?retryWrites=true&w=majority');
// const share = new ShareDB({db});
//Set sharedb presence to true, and do not forward presence error to clients
const share = new ShareDB({db: docDB, presence: true, doNotForwardSendPresenceErrorsToClient: true });

// ShareDB connection
const wss = new WebSocket.Server({ port: process.env.SOCK || 9999 }); //Webserver for clients to connect to sharedb
// const ws = new WebSocket("ws://localhost:8090") //websocket for sharedb connection
wss.on('connection', (webSocket) => {
    share.listen(new WebSocketJSONStream(webSocket));
})
const connect = share.connect();



// Set static path from which to send file
app.use(express.static(path.join(__dirname, '/gdocs/build')))

// Base route - To login/register, redirects to home if logged in. All other paths require auth
app.get('/', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
})

// Displays 10 most recently used documents.
app.get('/home', (req, res) => {
//   console.log("home")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

app.get('/index/search', (req, res) => {
    console.log('search')
    res.json({})
})

app.get('/index/suggest', (req, res) => {
    console.log('suggest')
    res.json({})
})

// Document creation 
app.post('/collection/create', (req, res) => {
//   console.log("create doc")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let docid = v4();
    let newDoc = connect.get('documents', docid);
    newDoc.fetch(async function(err){
        if(err || newDoc.type !== null) return res.json({ error: true, message: "doc creation error" });
        newDoc.create([], 'rich-text', () => { });
        console.log(req.body.name)
        let nameDoc = new Doc({
            id: docid,
            name: req.body.name
        });
        await nameDoc.save();
        res.json({docid: newDoc.id});
    });
})

// Document deletion
app.post('/collection/delete', (req, res) => {
    // console.log('deleting doc')
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa');
    let delDoc = connect.get('documents', req.body.docid);
    delDoc.fetch(function(err){
        if(err) {
            console.log(err);
            return res.json({ error: true, message: 'doc deletion fetch error' });
        }
        if(delDoc.type === null) return res.json({ error: true, message: 'doc deletion null error' });
        delDoc.destroy(function(err){
            if(err) {
                console.log(err);
                res.json({ error: true, message: 'doc deletion destroy error' })
            }
        })
        delDoc.del(function(err){
            if (err) {
                res.json({ error: true, message: 'doc deletion error' })
            }
        })
        // console.log(`Deleting document ${req.body.docid}`);
        res.end();
    });
})

// Fetch recently used docs
app.get('/collection/list', async (req, res) => {
    console.log('Fetching top 10 most recent docs');
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa');
    console.log(req.session)
    console.log(req.session.loggedIn)
    if (req.session.loggedIn) {
        let query = connect.createFetchQuery('documents', {$sort: {"_m.mtime": -1}, $limit: 10});
        query.on('ready', async () =>{
            let documents = await Promise.all(query.results.map( async (element,index) => {
            try {
                let doc = await Doc.findOne({id: element.id})
                return {id: element.id, name: doc.name}
            }
            catch(err) {
                throw err
            }
            }))

            return res.json(documents);
        })
    } else {
        res.json({ error: true, message: '/collection/list not logged in'})
    }
    
})

// Upload media (MIME type may need to be adjusted; also may try Quill-image-uploader)
app.post("/media/upload",  async (req, res) => {
    // console.log("upload")
    console.log(req.headers)
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    var id = uuid.v4()
    let file = req.file
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // console.log('unsupported filetype')
            return res.json({ error: true, message: 'unsupported filetype'})
        } else if (err) {
            // console.log('dumb image testcase')
            return res.json({ error: true, message: 'unknown error'})
        }
    
        // console.log('image downloaded')
        res.json({ mediaid: mediaid})
    })
})

app.get("/media/access/:mediaid", (req, res) => {
//   console.log("access media")
  let id = req.params.mediaid
  res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
  if (!req.session.loggedIn) {
      console.log('not logged in image access')
      res.json({error: true, message: "Not logged in"})
      // res.redirect('/')
  } else {
    console.log('getting image: ' + id)
    res.sendFile(`./images/${id}.${imgDict[id]}`, {root: __dirname})
  }
})

// TODO: edit so takes in DOCID and OPID
app.post('/doc/op/:docid/:id', async (req, res) => {
    // console.log("send op")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let doc = connect.get("documents", req.params.docid)
    doc.preventCompose = true;
    let ops = req.body.op // Array of arrays of OTs
    let clientVersion = req.body.version
    console.log(`client: ${clientVersion} doc: ${docDict[req.params.docid].version}`)
    if (clientVersion < docDict[req.params.docid].version) {
        // doc.whenNothingPending( () => {
            res.json({status: "retry"})
            console.log("retry")
            res.end()
        // });
      return
    }
    // setTimeout(() => {
      doc.submitOp(ops, { source: req.params.id }, function() {
        
        
      })
    // }, 250)
    docDict[req.params.docid].version++;

    docDict[req.params.docid].users.forEach(function(uid) {
      // console.log(`${uid} received op from ${req.params.id} for version ${doc.version}`)
      doc.whenNothingPending( () => {    
          if (uid == req.params.id) {
                  let content = JSON.stringify({ack: ops})
                  // console.log(`ACK ${content} to ${uid}`)
                  connections[uid].write("data: " + content + "\n\n")
          }
          else {
              //let content = JSON.stringify({ content: ops, version: doc.version })
              let content = JSON.stringify(ops)
              // console.log(`SEND ${content} to ${uid}`)
              connections[uid].write("data: " + content + "\n\n")
          }
      });
   })
   
    res.json({status: "ok"})
    res.end()
})

// Not required?
app.get('/doc/get/:docid/:id', (req, res) => {
    // console.log("get html")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (!req.session.loggedIn) {
        res.redirect('/')
    } else {
        var doc = connect.get('documents', req.params.docid);
        var cfg = {}
        var converter = new DeltaConverter(doc.data.ops, cfg)
        var html = converter.convert()
        res.send(html)
        res.end()
    }
})

app.get('/doc/edit/:docid', (req, res) => {
    // console.log("start edit")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

// TODO: Has to also take in userID: /doc/connect/DOCID/UID
app.get('/doc/connect/:docid/:id', async (req, res) => {
    // console.log("connect")
    num = 0
    res.writeHead(200, {
        'X-Accel-Buffering': 'no',
        // 'Location': process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '209.151.149.120:3000',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-CSE356': '61f9e6a83e92a433bf4fc9fa'
    }) // set up http stream
    res.flushHeaders(); // send headers
    let doc = connect.get("documents", req.params.docid)// get ops
    let oplist = ""
    if (doc.data) {
        oplist = doc.data.ops
    }
    let content = JSON.stringify({ content: oplist, version: doc.version })
    //let content = JSON.stringify({content: oplist})
    let presence = connect.getDocPresence(doc.collection, doc.id)
    presence.subscribe();
    presence.create(req.params.id);
    connections[req.params.id] = res
    if (docDict[req.params.docid] == undefined) docDict[req.params.docid] = {version: doc.version, users: new Set()}
    docDict[req.params.docid].users.add(req.params.id)

    
    res.write("data: " + content  + "\n\n")

    
    share.use('sendPresence', function(context,next){
        console.log("send presence")
        if (context.presence.d !== req.params.docid) return;
        let content = JSON.stringify({presence: {id: context.presence.id, cursor: context.presence.p }});
        console.log(`Broadcasting presence: ${req.params.id} ` )
        console.log(content)
        res.write("data: " + content + "\n\n" );
        next()
    }) 
});

// Presence id API
app.post("/doc/presence/:docid/:id", async (req, res) => {
    console.log("presents")
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    //Use the corresponding local presence to submit the provided location of cursor
    let doc = connect.get("documents", req.params.docid)
    let presence = connect.getDocPresence(doc.collection, doc.id)
    let cursor = {...req.body, name: req.session.name};
    presence.localPresences[req.params.id].submit(cursor);
    res.json({});


})

// Login route
app.post("/users/login", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    // console.log('login with email: ' + req.body.email)
    // console.log(req.body)
	let user = await User.findOne({ email: req.body.email, password: req.body.password, verified: true });
	if (user && user.verified === false) {
        res.json({ error: true, message: 'login user not verified'});
    } else if (user && user.password !== req.body.password) {
        res.json({ error: true, message: 'login incorrect password'});
    } else if (user) {
        // console.log('logged in')
        req.session.loggedIn = true
        req.session.email = req.body.email
        req.session.name = user.name
        req.session.save()
        res.json({ name: user.name })
	} else {
        console.log('login no user found probably:' + req.body.email + ' and ' + req.body.password)
		res.json({ error: true, message: 'login error prob no user found' });
	}
})

// Logout route
app.post("/users/logout", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if (!req.session.loggedIn) {
		res.json({ error: true, message: 'logout not logged in' });
	}
	else {
        console.log('logging out user: ' + req.headers.cookie.id)
		// res.cookie("id", "", { path: '/', expires: new Date() })
        // res.cookie("name", "", { path: '/', expires: new Date() })
        res.clearCookie("id")
        res.clearCookie("name")
        req.session.loggedIn = false
        req.session.email = undefined
        req.session.name = undefined
        // res.json({ status: "OK" })
        res.json({})
	}
})

// Signup route. TODO: Mail fix
app.post("/users/signup", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    // console.log(req.body)
    console.log('signup with email: ' + req.body.email)
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.json({ error: true, message: 'signup user exist error' });
    } else {
        // Insert the new user if they do not exist yet
        let key = v4();
        user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            verified: false,
            vpassword: key
        });
        
        await user.save();
        let mailOptions = {
            from: 'root@googledocs-m2',
            to: req.body.email,
            subject: 'Verification Password',
            text: `http://teos-llamas.cse356.compas.cs.stonybrook.edu/users/verify?email=${encodeURIComponent(req.body.email)}&key=${key}`
        }
        let info = await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
                // TODO: RECOMMENT ONCE BACK ON SERVER, THIS BREAKS CLIENT
                res.json({ error: true, message: 'mail send error' })
            }
            else {
                console.log(info)
            }
        });
        // res.json({ status: "OK" });
        res.json({})
    }
})

// Verify route
app.get("/users/verify", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    // console.log('trying verify: ' + req.query.email + ' with vpass: ' + req.query.key)
    let user = await User.findOne({ email: req.query.email });
    if ((user && req.query.key === "KEY") || (user && req.query.key === user.vpassword)) {
        await User.updateOne({ email: req.query.email }, { verified: true });
        user = await User.findOne({ email: req.query.email });
        console.log('verified ' + req.query.email)
        res.redirect('/')
        // res.json({ status: "OK" })
    } else {
        console.log('verify fail ' + req.query.email)
        res.json({ error: true, message: 'verify error' });
    }
})

// Server start
app.listen(process.env.PORT || PORT, () => {
    console.log(`Server started on port ${PORT}`)
    // doc.fetch(function (err) {
    //     if (err) throw err;
    //     if (doc.type === null) {
    //         doc.create([], 'rich-text', () => { });
    //         console.log('doc created')
    //         // console.log(doc.data)
    //         return;
    //     }
    // })
    
})

process.on('SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    // some other closing procedures go here
    wss.close();
    process.exit(0);
  });

