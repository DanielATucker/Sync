// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs')
var ip = require('ip');
var hashFiles = require('hash-files');


import { io } from "socket.io-client";
import strftime from "strftime";


const socket = io(`http://${ip.address()}:6200`);

socket.on("connect", () => {
    console.log("Connected to server");
    
    setInterval(() => {
        socket.emit("get_manifest");
    }, 1000);
});

socket.on("message", (message) => {
    console.log(message);
});

socket.on("ping", () => {
    console.log(`Received ping`);
    socket.emit("pong", ip.address());  
});

socket.on("return_manifest", (manifest) => {
    console.log(`Returned Manifest: ${JSON.stringify(manifest, null, 2)}`);
});

socket.io.on("error", (error) => {
    console.log(error);
});