import React, { useEffect } from 'react';
import Quill from 'quill';
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

const serverBaseURL = "http://localhost:8080";
const connection = new Sharedb.Connection(serverBaseURL);

// Querying for our document
const doc = connection.get('documents', 'firstDocument');

let id = uuidv4();

function App() {

  useEffect(() => {
    const sse = new EventSource(`${serverBaseURL}/connect/${id}`, { withCredentials: true });
    // doc.fetch((err) => {
    //   if (err) throw err;
    //   if (doc.type !== null) {
    //       console.log('hi')
    //   }
    // })




    const toolbarOptions =[ ['bold', 'italic', 'underline', 'strike', 'align'] ];
        const options = {
          theme: 'snow',
          modules: {
            toolbar: toolbarOptions,
          },
        };
    let quill = new Quill('#editor', options);

    console.log(sse)
    // ISSUE: server sending to 8080 i think, we on port 3000
    sse.onmessage = (e) => {
      let data = JSON.parse(e.data)
      console.log(data);
      // var ops = [
      //   { insert: 'Hello World!' },
      // ];
      // console.log(ops)
      quill.setContents(data);
    }
    sse.onerror = (e) => {
      // error log here 
      // console.log('hi')
      console.log(e);
      // sse.close();
    }
    doc.subscribe(function (err) {
        if (err) throw err;
  
        // const toolbarOptions =[ ['bold', 'italic', 'underline', 'strike', 'align'] ];
        // const options = {
        //   theme: 'snow',
        //   modules: {
        //     toolbar: toolbarOptions,
        //   },
        // };
        // let quill = new Quill('#editor', options);
        quill.setContents(doc.data);
        quill.on('text-change', function (delta, oldDelta, source) {
          if (source !== 'user') return;
          doc.submitOp(delta, { source: quill });
        });
        doc.on('op', function (op, source) {
          if (source === quill) return;
          quill.updateContents(op);
        });
      });
      // return () => {
      //   sse.close();
      // };
      // return () => {
      //   connection.close();
      // };

    
}, []);

  // useEffect(() => {
  //   doc.subscribe(function (err) {
  //     if (err) throw err;

  //     const toolbarOptions =[ ['bold', 'italic', 'underline', 'strike', 'align'] ];
  //     const options = {
  //       theme: 'snow',
  //       modules: {
  //         toolbar: toolbarOptions,
  //       },
  //     };
  //     let quill = new Quill('#editor', options);
  //     /**
  //      * On Initialising if data is present in server
  //      * Updaing its content to editor
  //      */
  //     quill.setContents(doc.data);

  //     /**
  //      * On Text change publishing to our server
  //      * so that it can be broadcasted to all other clients
  //      */
  //     quill.on('text-change', function (delta, oldDelta, source) {
  //       if (source !== 'user') return;
  //       doc.submitOp(delta, { source: quill });
  //     });

  //     /** listening to changes in the document
  //      * that is coming from our server
  //      */
  //     doc.on('op', function (op, source) {
  //       if (source === quill) return;
  //       quill.updateContents(op);
  //     });
  //   });
  //   return () => {
  //     connection.close();
  //   };
  // }, []);

  return (
    <div style={{ margin: '5%', border: '1px solid' }}>
      <div id='editor'></div>
    </div>
  );
}

export default App;
