// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs')
var ip = require('ip');

import { io } from "socket.io-client";
import strftime from "strftime";

const socket = io("http://100.69.19.3:6200");

socket.on("connect", () => {
    console.log("Connected to server");
    setTimeout(queue, 3000);  
});

socket.on("message", (message) => {
    console.log(message);
});

socket.on("ping", () => {
    socket.emit("pong", ip.address());  
});

socket.on("job", (ticket) => {
    let fileName = ticket.file;
    
    try {
        if (fs.existsSync(fileName)) {
            console.log(`${fileName} Found`)

            ticket.clientResponses[ip.address()] = {
                "hasUpdatedFile": true
            };

            ticket.lastModifiedBy = ip.address();

            socket.emit("initialResponse", ticket);
        }
    } catch(err) {
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

function queue() {
    socket.emit("newJob", `fileName_${strftime("%y%m%d_%X")}`);
};
