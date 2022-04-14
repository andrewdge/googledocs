import React, { useEffect } from 'react';
import Quill, { Delta } from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors  from 'quill-cursors'
import Sharedb from 'sharedb/lib/client';
import richText from 'rich-text';
import { v4 as uuidv4 } from 'uuid';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useParams } from "react-router-dom";

// Registering the rich text type to make sharedb work
// with our quill editor
Sharedb.types.register(richText.type);
Quill.register('modules/cursors', QuillCursors);

// Connecting to our socket server
// const socket = new WebSocket('ws://127.0.0.1:8080');
// const connection = new Sharedb.Connection(socket);

const serverBaseURL = process.env.NODE_ENV === 'development' ? "http://localhost:8080" : "";
//Web socet to connect to webserver hosting sharedb
const websocketURL = `ws://${window.location.hostname}:8090`
console.log(window.location.hostname);  
const connection = new Sharedb.Connection(new ReconnectingWebSocket(websocketURL));
let buffer = []

// Querying for our document
var docid
var doc


let id = uuidv4();

function UI() {
  const params = useParams()
  let num = 0
  docid = params.docid
  doc = connection.get('documents', docid);
  useEffect(() => {
    // Fetch for doc data should be here
    console.log("ussing na effect!!!")
    const cursorColors = {}
    const sse = new EventSource(`${serverBaseURL}/doc/connect/${docid}/${id}`, { withCredentials: true }); // set up event source receiver
    const toolbarOptions =[ ['bold', 'italic', 'underline', 'strike', 'align'], ["image"] ];
        const options = {
          theme: 'snow',
          modules: {
            toolbar: toolbarOptions,
            cursors: true
          },
        };
    let quill = new Quill('#editor', options); // setup quill
    let cursors = quill.getModule("cursors");
    doc.subscribe();
    const presence = connection.getDocPresence(doc.collection, docid)
    presence.subscribe();
    
    // ISSUE: server sending to 8080 i think, we on port 3000
    sse.onmessage = (e) => {
      console.log("received")
      let data = JSON.parse(e.data) 
      let text;
      if (data.content) console.log(data.content)
      if (data.content === undefined) {
        text = data;
      }
      else {
        text = data.content
      }
      quill.updateContents(text); // set initial doc state
      
    }
    sse.onerror = (e) => {
      // error log here 
      // console.log('hi')
      console.log(e);
      sse.close();
    }

    window.disconnect = function () {
      console.log("CLOSING connection")
      sse.close();
    }
    quill.setContents(doc.data);
    quill.on('text-change', async function (delta, oldDelta, source) {
      if (source !== "user") return;
      let payload = (delta.ops)
      var mediaId = undefined
      if (payload[0].insert && payload[0].insert.image) {
        var mediaId = await fetch(`${serverBaseURL}/media/upload`, {
          method: "POST",
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        }).then(res => res.json())
        .then(response => mediaId = response)
        .catch(error => console.error('Error:', error));
      }
      if (mediaId != undefined && mediaId != "Unsupported file type") {
        payload = [{insert: {image: `${serverBaseURL}/media/access/${mediaId}`}}]
      }
      num++
      fetch(`${serverBaseURL}/doc/op/${docid}/${id}`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      })
    });
    
    //When the user moves their cursor to a different location, send post request
    // to server with the range and index of the cursor
    quill.on('selection-change', function(range,oldRange, source) {
      //Return if the range is invalid or if the change in cursor does not come from the user
      if(source !== "user") return;
      if(!range) return;
      submitPresence(range);
    });

    //When an update of another user's presence has been received, 
    //Generate cursor 
    presence.on('receive', function(id,cursor){
      //If the update is from a new user, create a new cursor color
      if(cursorColors[id] === undefined) {
        let color = "#" +   Math.floor(Math.random()*0xFFFFFF).toString(16);
        console.log(color);
        cursorColors[id] = color
      } 
      //Create and move cursor to correct location
      // Replace 2nd id with account name
      cursors.createCursor(id, id ,cursorColors[id]);
      cursors.moveCursor(id, cursor);
    })
}, []);

 return (
    <div style={{ margin: '5%', border: '1px solid' }}>
      <div id='editor'></div>
    </div>
  );
}
//Send an api request to presence/:id route, change to match apis in milestone 
function submitPresence(range){
  if(!range) return;
  console.log(range);
  fetch(`${serverBaseURL}/doc/presence/${docid}/${id}`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(range)
  });
}
export default UI;
