// const WebSocket = require('ws');
// const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const express = require('express')
// const http = require('http')
const bodyParser = require('body-parser')
// const session = require('express-session')
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
// const JSON5 = require('json5')

const PORT = 8080;
const app = express()
// const server = http.createServer(app)
// const wss = new WebSocket.Server({ server: server })
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
})); // need this since we are on 2 ports

// app.use(session({
//     genid: function(req) {
//         return uuidv4() // use UUIDs for session IDs
//     },
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
// }))

ShareDB.types.register(require('rich-text').type); // type registration, rich text is like bold, italic, etc

const share = new ShareDB();
const connect = share.connect();

const doc = connect.get('documents', 'firstDocument'); // get the only document

app.get('/', (req, res) => {
    res.redirect('http://localhost:3000')
})

app.post('/op/:id', (req, res) => {
    // console.log(req.body)
    let ops = req.body
    doc.submitOp(ops) // submit for changes
})

app.get('/connect/:id', async (req, res) => {
    console.log(req.params.id)
    res.writeHead(200, {
        'Location': 'http://localhost:3000',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    }) // set up http stream
    res.flushHeaders(); // send headers
    let firstMessage = true;
    if (firstMessage) {
        let oplist = doc.data.ops // get ops
        let content = JSON.stringify({content: oplist})
        // console.log(content)
        console.log('first message')
        res.write("data: " + content + "\n\n")
        firstMessage = false
    } else {
        // THIS DOES NOT WORK
        console.log('hi')
        // doc.subscribe((e) => {
        //     if (e) throw e;
        //     console.log(doc.data.ops)
        //     res.write("data: " + JSON.stringify(doc.data.ops) + "\n\n")
        // })
    }
    
    // res.end()
    // doc.subscribe((e) => {
    //     if (e) throw e;
    //     if (doc.type !== null) {
    //         res.write({ data: { content: }})
    //     }
    // })
    
});

// const doc = connect.get('documents', 'firstDocument');
// doc.fetch(function (err) {
//     if (err) throw err;
//     if (doc.type === null) {
//         doc.create([{ insert: 'Hello World!' }], 'rich-text', () => {
//         //   const wss = new WebSocket.Server({ port: 8080 });

//         //   wss.on('connection', function connection(ws) {
//         //     // For transport we are using a ws JSON stream for communication
//         //     // that can read and write js objects.
//         //     const jsonStream = new WebSocketJSONStream(ws);
//         //     share.listen(jsonStream);
//         //   });

//             wss.on('connection', (websocket) => {
//                 let stream = new WebSocketJSONStream(websocket)
//                 share.listen(stream) 
//             })
//         });
//         return;
//     }
// });



app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
    doc.fetch(function (err) {
        if (err) throw err;
        if (doc.type === null) {
            doc.create([{ insert: 'Hello World!' }], 'rich-text', () => {});
            console.log('doc created')
            // console.log(doc.data)
            return;
        }
    })
})

