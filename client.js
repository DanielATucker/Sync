// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs')
var ip = require('ip');

import { io } from "socket.io-client";
import strftime from "strftime";

import Backup from "./sync_modules/backup.js"


const socket = io("http://100.69.19.3:6200");

socket.on("connect", () => {
    console.log("Connected to server");
    
    Backup(socket);

    console.log("Backup Started");
});

socket.on("message", (message) => {
    console.log(message);
});

socket.on("ping", () => {
    socket.emit("pong", ip.address());  
});

socket.on("job", (ticket) => {
    console.log(`Received Job: ${JSON.stringify(ticket, null, 2)}`);

    let fileName = ticket.file;
    
    if (fs.existsSync(fileName)) {
        console.log(`${fileName} Found`)

        ticket.clientResponses[ip.address()] = {
            "hasUpdatedFile": true
        };

        ticket.lastModifiedBy = ip.address();

        socket.emit("initialResponse", ticket);
    }
    else {
        console.log(`${fileName} Not Found`);

        ticket.clientResponses[ip.address()] = {
            "hasUpdatedFile": false
        };

        ticket.lastModifiedBy = ip.address();

        socket.emit("initialResponse", ticket);
    }
});

socket.io.on("error", (error) => {
    console.log(error);
});