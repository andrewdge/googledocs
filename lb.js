// concurrently "node lb.js" "node server.js"
const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');
const http = require('http');
const httpProxy = require('http-proxy')
const { v4 } = require('uuid');
const cors = require('cors');
const session = require('express-session')
const cookieParser = require('cookie-parser')
const connection = require('./db.js')
const { User, validate } = require('./models/user')
const mongoose = require('mongoose')
const { MongoClient, ServerApiVersion } = require('mongodb');
const nodemailer = require('nodemailer')
const MongoDBStore = require('connect-mongodb-session')(session);

app.use(cors({ credentials: true }))
// app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '10mb'}));
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
// Set up cookies

  
// Application servers
let servers = [
    "http://localhost:8080",
    "http://localhost:8081",
    // "http://localhost:8082"
]

let transporter = nodemailer.createTransport({
    service: 'postfix',
    host: 'localhost',
    port: 25,
    auth: { user: 'root@googledocs-m2', pass: '' },
    tls: { rejectUnauthorized: false },
    name: 'root@googledocs-m2'
  });

mongoose.Promise = global.Promise;
(async () => await connection())();

const db = mongoose.connection

let store = new MongoDBStore({
    uri: "mongodb+srv://andrew:andrewge@cluster0.f9prs.mongodb.net/main?retryWrites=true&w=majority",
    collection: 'mySessions'
});
store.on('error', function(error) {
    console.log(error);
});

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    proxy: true,
    saveUninitialized: true,
    store: store,
}));

let proxy = httpProxy.createProxyServer({});

app.use(express.static(path.join(__dirname, '/gdocs/build')))

const hash = (id) => {
    let sum = [...id].map(char => char.charCodeAt(0)).reduce((current, previous) => previous + current)
    let server = sum % servers.length;
    console.log(server)
    return server;
}

app.use((req, res, next) => {
    console.log(req.session);
    next()
})

app.get('/', (req, res) => {
    // let s = Math.floor(Math.random() * servers.length);
    // console.log(s)
    // proxy.web(req, res, { target: servers[s] });
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
})

app.get('/home', (req, res) => {
    if (req.session.loggedIn) {
        res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
        res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
    } else {
        res.redirect('/')
    }
})

app.get('/index/search', async (req, res) => {
    proxy.web(req, res, { target: servers[Math.floor(Math.random() * servers.length)] });
})

app.get('/index/suggest', async (req, res) => {
    proxy.web(req, res, { target: servers[Math.floor(Math.random() * servers.length)] });
})

app.post('/collection/create', (req, res) => {
    console.log('rec')
    let s = Math.floor(Math.random() * servers.length)
    console.log(s)
    proxy.web(req, res, { target: servers[s] });
})

app.post('/collection/delete', (req, res) => {
    proxy.web(req, res, { target: servers[Math.floor(Math.random() * servers.length)] });
})

app.get('/collection/list', async (req, res) => {
    // console.log(req.session.loggedIn)
    if (req.session.loggedIn) {
        proxy.web(req, res, { target: servers[Math.floor(Math.random() * servers.length)] });
    } else {
        res.json({ error: true, message: '/collection/list not logged in'})
    }
    
})

app.post("/media/upload",  async (req, res) => {
    proxy.web(req, res, { target: servers[hash(Math.random() * servers.length)] });
})

app.get("/media/access/:mediaid", (req, res) => {
    //   console.log("access media")
      let id = req.params.mediaid
      res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
      if (!req.session.loggedIn) {
        //   console.log('not logged in image access')
          res.json({error: true, message: "Not logged in"})
          // res.redirect('/')
      } else {
        // console.log('getting image: ' + id)
        res.sendFile(`./images/${id}.${imgDict[id]}`, {root: __dirname})
      }
})

app.post('/test/op/:docid/:id', async (req, res) => {
    proxy.web(req, res, { target: servers[hash(docid)] });
})

app.get('/test/get/:docid/:id', (req, res) => {
    if (req.session.loggedIn) {
        proxy.web(req, res, { target: servers[hash(docid)] });
    } else {
        res.redirect('/')
    }
})

app.get('/test/edit/:docid', (req, res) => {
    if (req.session.loggedIn) {
        proxy.web(req, res, { target: servers[hash(docid)] });
    } else {
        res.redirect('/')
    }
})

app.get('/test/connect/:docid/:id', async (req, res) => {
    proxy.web(req, res, { target: servers[hash(docid)] });
});

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
        // console.log('login no user found probably:' + req.body.email + ' and ' + req.body.password)
		res.json({ error: true, message: 'login error prob no user found' });
	}
})

app.post("/users/logout", async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if (!req.session.loggedIn) {
		res.json({ error: true, message: 'logout not logged in' });
	}
	else {
        // console.log('logging out user: ' + req.headers.cookie.id)
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
    // console.log('signup with email: ' + req.body.email)
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
                // console.log(info)
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
        // console.log('verified ' + req.query.email)
        res.redirect('/')
        // res.json({ status: "OK" })
    } else {
        // console.log('verify fail ' + req.query.email)
        res.json({ error: true, message: 'verify error' });
    }
})

// app.use((req,res)=>{
//     // handler(req, res)
//     // let id = v4();
//     let v = 'test';
//     if (req.url.includes(v)) {
//         let split = req.url.split('/')
//         let docid = split[split.length - 1]
//         let s = hash(id)
//         res.json(s)
//         // proxy.web(req, res, { target: servers[current] });
//     }
    
// });


proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });

    // console.log(res);
   
    res.end('Something went wrong. And we are reporting a custom error message.');
});

PORT=8000
app.listen(PORT, err =>{
    err ?
    console.log(`Failed to listen on PORT ${PORT}`):
    console.log("Load Balancer Server " + `listening on PORT ${PORT}`);
});