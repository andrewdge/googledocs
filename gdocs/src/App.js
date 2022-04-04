import React, { useEffect } from 'react';
import Quill, { Delta } from 'quill';
import 'quill/dist/quill.snow.css';
import Sharedb from 'sharedb/lib/client';
import richText from 'rich-text';
import { v4 as uuidv4 } from 'uuid';

// Registering the rich text type to make sharedb work
// with our quill editor
Sharedb.types.register(richText.type);


// Connecting to our socket server
// const socket = new WebSocket('ws://127.0.0.1:8080');
// const connection = new Sharedb.Connection(socket);

const serverBaseURL = process.env.NODE_ENV === 'development' ? "http://localhost:8080" : "";
const connection = new Sharedb.Connection(serverBaseURL);

// Querying for our document
const doc = connection.get('documents', 'firstDocument');

let id = uuidv4();
const presence = connection.getDocPresence(doc.collection, doc.id)
presence.subscribe()

function App() {

  useEffect(() => {
    const sse = new EventSource(`${serverBaseURL}/connect/${id}`, { withCredentials: true }); // set up event source receiver
    console.log('uuid is: ' + id)
  
    const toolbarOptions =[ ['bold', 'italic', 'underline', 'strike', 'align'] ];
        const options = {
          theme: 'snow',
          modules: {
            toolbar: toolbarOptions,
          },
        };
    let quill = new Quill('#editor', options); // setup quill

    console.log(sse)
    // ISSUE: server sending to 8080 i think, we on port 3000
    sse.onmessage = (e) => {
      console.log(e.data)
      let data = JSON.parse(e.data)
      let text;
      if (data.content) console.log(data.content)
      if (data.content === undefined) text = data
      else text = data.content
      // var cursor = quill.getSelection().index
      quill.updateContents(text); // set initial doc state
      // quill.setSelection(cursor);
    }
    sse.onerror = (e) => {
      // error log here 
      // console.log('hi')
      console.log(e);
      // sse.close();
    }

    quill.setContents(doc.data);
    quill.on('text-change', function (delta, oldDelta, source) {
      if (source !== "user") return;
      // doc.submitOp(delta, { source: quill });
      // console.log(id)
      let payload = JSON.stringify(delta.ops)
      console.log(payload)
      fetch(`${serverBaseURL}/op/${id}`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: payload
      }) // post updates
    });
}, []);


  return (
    <div style={{ margin: '5%', border: '1px solid' }}>
      <div id='editor'></div>
    </div>
  );
}

export default App;
