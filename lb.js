const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');
  
// Application servers
const servers = [
    "http://localhost:3000",
    "http://localhost:3001"
]
  
// Track the current application server to send request
let current = 0;
  
// Receive new request
// Forward to application server
const handler = async (req, res) =>{
  
    // Destructure following properties from request object
    const { method, url, headers, body } = req;
  
    // Select the current server to forward the request
    const server = servers[current];
  
    // Update track to select next server
    if (!req.url.includes('manifest') && !req.url.includes('static') && !req.url.includes('logo')){
        current === (servers.length-1)? current = 0 : current++
    }
    
  
    console.log(`current server: ${current}`)
    // console.log(req.url)
    try{
        // Requesting to underlying application server
        const response = await axios({
            url: `${server}${url}`,
            method: method,
            headers: headers,
            data: body
        });
        // Send back the response data
        // from application server to client 
        res.send(response.data)
    }
    catch(err){
        // Send back the error message 
        res.status(500).send("Server error!")    
    }
}
  
  
// When receive new request
// Pass it to handler method
app.use((req,res)=>{
    handler(req, res)
});
  
// Listen on PORT 8080
app.listen(8080, err =>{
    err ?
    console.log("Failed to listen on PORT 8080"):
    console.log("Load Balancer Server "
          + "listening on PORT 8080");
});