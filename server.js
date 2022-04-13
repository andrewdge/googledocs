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
const download = require('image-downloader')
const { v4 } = require('uuid');
const MongoShareDB = require('sharedb-mongo');


const PORT = 8080;
const app = express()
// const server = http.createServer(app)
// const wss = new WebSocket.Server({ server: server })


app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cookieParser())
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:8080', '209.151.149.120:3000', '209.151.149.120:8080']
})); // need this since we are on 2 ports

// here
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    }
})
//here



mongoose.Promise = global.Promise;
(async () => await connection())();
// mongoose.connect(`mongodb://admin:password@localhost:27017`, {useNewUrlParser: true}, function (err) {
//   if (err) throw err;
//   console.log("successfully connected");
// })
const db = mongoose.connection
ShareDB.types.register(require('rich-text').type); // type registration, rich text is like bold, italic, etc

// const share = new ShareDB();
const docDB = MongoShareDB('mongodb+srv://andrew:andrewge@cluster0.f9prs.mongodb.net/main?retryWrites=true&w=majority');
// const share = new ShareDB({db});
//Set sharedb presence to true, and do not forward presence error to clients
const share = new ShareDB({db: docDB, presence: true, doNotForwardSendPresenceErrorsToClient: true });
const wss = new WebSocket.Server({ port: 8090 }); //Webserver for clients to connect to sharedb
const ws = new WebSocket("ws://localhost:8090") //websocket for sharedb connection
wss.on('connection', (webSocket) => {
    share.listen(new WebSocketJSONStream(webSocket));
})

const connect = share.connect();

let doc = connect.get('documents', 'firstDocument'); // get the only document
//doc.preventCompose = true;
//console.log(doc)
let presence = connect.getDocPresence(doc.collection, doc.id)
presence.subscribe();

app.use(express.static(path.join(__dirname, '/gdocs/build')))

app.get('/', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
})

app.get('/home', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.cookies && req.cookies.id && req.cookies.name) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

app.post('/collection/create', (req, res) => {
    console.log('creating doc')
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let docid = v4(); 
    let newDoc = connect.get('documents', docid);
    newDoc.fetch(function(err){
        if(err || newDoc.type !== null) return res.json({ status: "ERROR" });
        newDoc.create({title: req.body.name}, 'rich-text', () => { });
        res.json({docid: newDoc.id});
    });
})

app.post('/collection/delete', (req, res) => {
    console.log('deleting doc')
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa');
    let delDoc = connect.get('documents', req.body.docid);
    delDoc.fetch(function(err){
        if(err) {
            console.log(err);
            return res.json({ status: "ERROR" });
        }
        if(delDoc.type === null) return res.json({ status: "ERROR" });
        delDoc.destroy(function(err){
            if(err) console.log(err);
        })
        console.log(`Deleting document ${req.body.docid}`);
        res.end();
    });
})

app.get('/collection/list', (req, res) => {
    console.log('Fetching top 10 most recent docs');
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa');
    let query = connect.createFetchQuery('documents', {$orderby: {"_m.mtime": -1}, $limit: 10});
    query.on('ready', () =>{
        console.log(query.results.length)
        let documents = query.results.map((element,index) => {
            return {id: element.id, name: element.data.name}
        });

        console.log(documents);
        return res.json(JSON.stringify(documents));
    })
})
app.post("/media/upload", async (req, res) => {
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


app.post('/doc/op/:id', async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let ops = req.body // Array of arrays of OTs
    doc.submitOp(ops, { source: req.params.id })
    res.end()
})

app.get('/doc/:id', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    var cfg = {}
    var converter = new DeltaConverter(doc.data.ops, cfg)
    var html = converter.convert()
    res.send(html)
    res.end()
})

app.get('/doc/edit/:id', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    if (req.cookies && req.cookies.id && req.cookies.name) {
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

app.get('/doc/connect/:id', async (req, res) => {
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
    let oplist = doc.data.ops // get ops
    let content = JSON.stringify({ content: oplist })
    //let content = JSON.stringify({content: oplist})
    presence.create(req.params.id);
    console.log(`first write: ${content}`)
    res.write("data: " + content + "\n\n")
    doc.on('op batch', (op, src) => {
        if (src == req.params.id) return
        let content = JSON.stringify({ content: op })
        console.log(`subsequent write: ${content}`)
        res.write("data: " + content + "\n\n")
    });
});

//Presence id API
app.post("/doc/presence/:id", async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    //Use the corresponding local presence to submit the provided location of cursor
    presence.localPresences[req.params.id].submit(req.body);
    res.end();

})


app.post("/users/login", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	let user = await User.findOne({ username: req.body.username, password: req.body.password, verified: true });
	if (req.cookies.id === req.sessionID) {
		res.json({ status: "ERROR" });
	}
	else if (user) {
		res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		res.cookie('id', req.sessionID);
        res.cookie('name', req.body.username);
        res.redirect('/home')
        // res.json({ status: "OK" });
	} else {
		res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		res.json({ status: "ERROR" });
	}
})

app.post("/users/logout", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if (req.cookies.id !== req.sessionID) {
		res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		res.json({ status: "ERROR" });
	}
	else {
		res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		// res.cookie("id", "")
        // res.cookie("name", "")
        res.clearCookie("id")
        res.clearCookie("name")
        // res.json({ status: "OK" })
        res.redirect('/')
	}
})

app.post("/users/signup", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.json({ status: "ERROR" });
    } else {
        // Insert the new user if they do not exist yet
        user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            verified: false
        });
        await user.save();
        let mailOptions = {
            from: '"I like llamas" <testing356email@gmail.com>',
            to: req.body.email,
            subject: 'Verification Password',
            text: `209.151.153.183:8080/users/verify?email=${req.body.email}&key=KEY`,
            html: `<div>209.151.153.183:8080/users/verify?email=${req.body.email}&key=KEY</div>`
        }
        let info = await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.json({ status: "OK" })
            }
        });
        // res.json({ status: "OK" });
        res.redirect('/')
    }
})

app.get("/users/verify", async (req, res) => {
    res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
    let user = await User.findOne({ email: req.query.email });
    if (user && req.query.key === "KEY") {
        await User.updateOne({ email: req.query.email }, { verified: true });
        user = await User.findOne({ email: req.query.email });
        console.log('verified')
        res.redirect('/')
        // res.json({ status: "OK" })
    } else {
        res.json({ status: "ERROR" });
    }
})


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
    doc.fetch(function (err) {
        if (err) throw err;
        if (doc.type === null) {
            doc.create([], 'rich-text', () => { });
            console.log('doc created')
            // console.log(doc.data)
            return;
        }
    })
})

