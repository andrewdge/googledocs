// const WebSocket = require('ws');
// const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const express = require('express')
const DeltaConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
// const http = require('http')
const bodyParser = require('body-parser')
// const session = require('express-session')
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
// const JSON5 = require('json5')
const path = require('path')

const PORT = 8080;
const app = express()
// const server = http.createServer(app)
// const wss = new WebSocket.Server({ server: server })
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:8080', '209.151.149.120:3000', '209.151.149.120:8080']
})); // need this since we are on 2 ports

ShareDB.types.register(require('rich-text').type); // type registration, rich text is like bold, italic, etc

// const share = new ShareDB();
// const db = require('sharedb-mongo')('mongodb://localhost:27017/test');
// const share = new ShareDB({db});
const share = new ShareDB();
share.presence = true;

const connect = share.connect();

const doc = connect.get('documents', 'firstDocument'); // get the only document

app.use(express.static(path.join(__dirname, '/gdocs/build')))

app.get('/', (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    res.sendFile(path.join(__dirname, "gdocs/build/index.html"))
})

app.post('/op/:id', async (req, res) => {
    res.setHeader('X-CSE356', '61f9e6a83e92a433bf4fc9fa')
    let ops = req.body // Array of arrays of OTs
    console.log(`op from ${req.params.id}: `)
    console.log(ops)
    for (var i = 0; i < ops.length; i++) {
      doc.submitOp(ops[i], {source: req.params.id})
    }
    console.log("Doc after ops")
    console.log(doc.data.ops)
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

app.get('/connect/:id', async (req, res) => {
    num = 0
    console.log("Connection: " + req.params.id)
    res.writeHead(200, {
        'X-Accel-Buffering' : 'no',
        'Location': process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '209.151.149.120:3000',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-CSE356': '61f9e6a83e92a433bf4fc9fa'
    }) // set up http stream
    res.flushHeaders(); // send headers
    const presence = connect.getDocPresence(doc.collection, doc.id)
    presence.subscribe()
    //console.log(doc)
    let oplist = doc.data.ops // get ops
    let content = JSON.stringify({content: oplist})
    //let content = JSON.stringify({content: oplist})
    console.log(`first write: ${content}`)
    res.write("data: " + content + "\n\n")
    doc.on('op', (op, src) => {
      if (src == req.params.id) return
      let content = JSON.stringify(op)
        console.log(`subsequent write: ${content}`)
        res.write("data: " + content + "\n\n")
    })
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
    doc.fetch(function (err) {
        if (err) throw err;
        if (doc.type === null) {
            doc.create([], 'rich-text', () => {});
            console.log('doc created')
            // console.log(doc.data)
            return;
        }
    })
})

