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


const PORT = 8080;
const app = express()
// const server = http.createServer(app)
// const wss = new WebSocket.Server({ server: server })

// For image/file limit
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }))
app.use(bodyParser.json())
app.use(cookieParser())
// Set up cookies
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// CORS between the front/backend
app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:8080', '209.151.149.120:3000', '209.151.149.120:8080']
})); // need this since we are on 2 ports

// Probably not needed
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'ejs')


// Nodemailer with Postfix
let transporter = nodemailer.createTransport({
    service: 'postfix',
    host: 'localhost',
    secure: false,
    port: 25,
    auth: { user: 'root@googledocs-m2', pass: '' },
    tls: { rejectUnauthorized: false }
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
const wss = new WebSocket.Server({ port: 8090 }); //Webserver for clients to connect to sharedb
const ws = new WebSocket("ws://localhost:8090") //websocket for sharedb connection
wss.on('connection', (webSocket) => {
    share.listen(new WebSocketJSONStream(webSocket));
})
const connect = share.connect();

/*
Presence subscribed to for each client on a single doc.
1.X Client enters doc via GET doc/connect/DOCID/UID route. Start connection
2.X Client asks for doc editor via GET doc/edit/DOCID route
3.X Client subscribes to the presence of the document
4.X On change for client-side, send on the OP route their UID and DOCID and delta the given document.
5. doc/get/DOCID/UID returns html for given document.


*/


// Set static path from which to send file
app.use(express.static(path.join(__dirname, '/gdocs/build')))

// Base route - To login/register, redirects to home if logged in. All other paths require auth
app.get('/', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
})

// Displays 10 most recently used documents.
app.get('/home', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.cookies && req.cookies.id && req.cookies.name) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

// Document creation 
app.post('/collection/create', (req, res) => {
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
    console.log('deleting doc')
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
        console.log(`Deleting document ${req.body.docid}`);
        res.end();
    });
})

// Fetch recently used docs
app.get('/collection/list', async (req, res) => {
    console.log('Fetching top 10 most recent docs');
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa');
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
        // console.log(documents);
        json = JSON.stringify(documents);
        // console.log(typeof json)
        console.log(json)
        return res.json(json);
    })
})

// Upload media (MIME type may need to be adjusted; also may try Quill-image-uploader)
app.post("/media/upload", async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    var id = uuid.v4()
    var uri = req.body[0].insert.image
    var index = uri.lastIndexOf(".")
    console.log(uri)
    var mime = uri.substring(index + 1)
    if (mime != "jpeg" && mime != "jpg" && mime != "png") res.send(JSON.stringify("Unsupported file type"))
    var options = {url: uri, dest: path.join(__dirname, "images", `${id}.png`)}
    download.image(options)
    .then(({ filename }) => {
        console.log('Saved to', filename)  // saved to /path/to/dest/photo.jpg
    })
    .catch((err) => console.error(err))
    res.send(JSON.stringify(id))
})

app.get("/media/access/:mediaid", (req, res) => {
  let id = req.params.mediaid
  res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
  res.sendFile(`./images/${id}.png`, {root: __dirname})
})

// TODO: edit so takes in DOCID and OPID
app.post('/doc/op/:docid/:id', async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let doc = connect.get("documents", req.params.docid)
    let ops = req.body.payload // Array of arrays of OTs
    
    let clientVersion = req.body.version
    console.log(`client: ${clientVersion}`)
    console.log(`doc: ${doc.version}`)
    if (clientVersion < doc.version) {
      console.log(clientVersion)
      console.log(doc.version)
      res.json({status: "retry"})
      console.log("retry")
      res.end()
      return
    }
    doc.submitOp(ops, { source: req.params.id }, function() {
      res.json({status: "ok"})
      res.end()
      return
    })
    
})

// Not required?
app.get('/doc/get/:docid/:id', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    var doc = connect.get('documents', req.params.docid);
    var cfg = {}
    var converter = new DeltaConverter(doc.data.ops, cfg)
    var html = converter.convert()
    res.send(html)
    res.end()
})

app.get('/doc/edit/:docid', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.cookies && req.cookies.id && req.cookies.name) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

// TODO: Has to also take in userID: /doc/connect/DOCID/UID
app.get('/doc/connect/:docid/:id', async (req, res) => {
    console.log("connectaffffffffffffffffffffasdfsaaADFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
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
    if (doc.data)
      oplist = doc.data.ops


    let content = JSON.stringify({ content: oplist, version: doc.version })
    //let content = JSON.stringify({content: oplist})
    let presence = connect.getDocPresence(doc.collection, doc.id)
    presence.subscribe();
    presence.create(req.params.id);
    console.log(`first write: ${content}`)
    res.write("data: " + content  + "\n\n")
    doc.on('op', (op, src) => {
        if (src == req.params.id) {
          return
        }
        let content = JSON.stringify({ content: op })
        console.log(`subsequent write: ${content}`)
        res.write("data: " + content + "\n\n")
    });
    doc.on("before op", (op, src) => {
      if (src == req.params.id) {
        content = JSON.stringify({ack: op})
        res.write("data: " + content + "\n\n")
        return
      }
    })

    share.use('sendPresence', function(context,next){
        let content = JSON.stringify({presence: {id: context.presence.id, cursor: context.presence.p}/*, doc: context.presence.d */});
        res.write("data: " + content + "\n\n" );
        next()
    }) 
});

// Presence id API
app.post("/doc/presence/:docid/:id", async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    //Use the corresponding local presence to submit the provided location of cursor
    let doc = connect.get("documents", req.params.docid)
    let presence = connect.getDocPresence(doc.collection, doc.id)
    presence.localPresences[req.params.id].submit(req.body);
    res.end();

})

// Login route
app.post("/users/login", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	let user = await User.findOne({ username: req.body.username, password: req.body.password, verified: true });
	if (req.cookies.id === req.sessionID) {
		res.json({ error: true, message: 'login mismatch sessionID and cookie id' });
	}
	else if (user) {
		res.cookie('id', req.sessionID);
        res.cookie('name', req.body.username);
        res.redirect('/home')
        // res.json({ status: "OK" });
	} else {
		res.json({ error: true, message: 'login incorrect password error' });
	}
})

// Logout route
app.post("/users/logout", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if (req.cookies.id !== req.sessionID) {
		res.json({ error: true, message: 'logout cookies session id error' });
	}
	else {
		// res.cookie("id", "", { path: '/', expires: new Date() })
        // res.cookie("name", "", { path: '/', expires: new Date() })
        res.clearCookie("id")
        res.clearCookie("name")
        // res.json({ status: "OK" })
        res.redirect('/')
	}
})

// Signup route. TODO: Mail fix
app.post("/users/signup", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.json({ error: true, message: 'signup user exist error' });
    } else {
        // Insert the new user if they do not exist yet
        let key = v4();
        user = new User({
            username: req.body.username,
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
            text: `209.151.153.183:8080/users/verify?email=${req.body.email}&key=${key}`,
            html: `<div>209.151.153.183:8080/users/verify?email=${req.body.email}&key=${key}</div>`
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
        res.redirect('/')
    }
})

// Verify route
app.get("/users/verify", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    let user = await User.findOne({ email: req.query.email });
    if (user && req.query.key === "KEY" || user && req.query.key === user.vpassword) {
        await User.updateOne({ email: req.query.email }, { verified: true });
        user = await User.findOne({ email: req.query.email });
        console.log('verified')
        res.redirect('/')
        // res.json({ status: "OK" })
    } else {
        res.json({ error: true, message: 'verify error' });
    }
})

// Server start
app.listen(PORT, () => {
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

