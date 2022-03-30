const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const express = require('express')
const http = require('http')


const app = express()
const server = http.createServer(app)
const webSocketServer = new WebSocket.Server({ server: server })

/**
 * By Default Sharedb uses JSON0 OT type.
 * To Make it compatible with our quill editor.
 * We are using this npm package called rich-text
 * which is based on quill delta
 */
ShareDB.types.register(require('rich-text').type);

const share = new ShareDB();
const connection = share.connect();

app.post('/op/:id', (req, res) => {
    
})

app.get('/connect/:id', (req, res) => {
    // DOES NOT QUITE WORK YET
    // const doc = connection.get('documents', 'firstDocument');

    // doc.fetch(function (err) {
    // if (err) throw err;
    // if (doc.type === null) {
    //     doc.create([{ insert: 'Hello World!' }], 'rich-text', () => {
    //     //   const wss = new WebSocket.Server({ port: 8080 });

    //     //   wss.on('connection', function connection(ws) {
    //     //     // For transport we are using a ws JSON stream for communication
    //     //     // that can read and write js objects.
    //     //     const jsonStream = new WebSocketJSONStream(ws);
    //     //     share.listen(jsonStream);
    //     //   });

    //         webSocketServer.on('connection', (websocket) => {
    //             let stream = new WebSocketJSONStream(websocket)
    //             share.listen(stream) 
    //         })
    //     });
    //     return;
    // }
    // });
})

const doc = connection.get('documents', 'firstDocument');
doc.fetch(function (err) {
    if (err) throw err;
    if (doc.type === null) {
        doc.create([{ insert: 'Hello World!' }], 'rich-text', () => {
        //   const wss = new WebSocket.Server({ port: 8080 });

        //   wss.on('connection', function connection(ws) {
        //     // For transport we are using a ws JSON stream for communication
        //     // that can read and write js objects.
        //     const jsonStream = new WebSocketJSONStream(ws);
        //     share.listen(jsonStream);
        //   });

            webSocketServer.on('connection', (websocket) => {
                let stream = new WebSocketJSONStream(websocket)
                share.listen(stream) 
            })
        });
        return;
    }
});



server.listen(8080)

