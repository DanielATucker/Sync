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

socket.on("job", (ticket, response) => {
    let fileName = ticket.file;
    
    try {
        if (fs.existsSync(fileName)) {
            console.log(`${filename} Found`)

            ticket.clientResponses[ip.address()] = {
                "hasUpdatedFile": true
            };

            ticket.lastModifiedBy = ip.address();

            response(ticket);
        }
    } catch(err) {
        console.log(`${filename} Not Found`);

        ticket.clientResponses[ip.address()] = {
            "hasUpdatedFile": false
        };

        response(ticket);
    }
});

socket.io.on("error", (error) => {
    console.log(error);
});

function queue() {
    socket.emit("newJob", `fileName_${strftime("%y%m%d_%X")}`);
};
