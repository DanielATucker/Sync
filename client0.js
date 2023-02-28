// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs')
var ip = require('ip');
var hashFiles = require('hash-files');


import { io } from "socket.io-client";
import strftime from "strftime";

import Backup from "./sync_modules/backup.js"


const socket = io("http://localhost:6200");

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
    
    if (ticket.jobType === "Created" ){
        created(ticket);
    }
    else if (ticket.jobType === "Changed" ){
        changed(ticket);
    }
    else if (ticket.jobType === "Deleted" ){
        deleted(ticket);
    };


});

function created(ticket){

    let fileName = ticket.file;


    if (fs.existsSync(fileName)) {
        console.log(`${fileName} Found`)

        ticket.clientResponses[ip.address()] = {
            "hasCreatedFile": true
        };

        ticket.lastModifiedBy = ip.address();

        socket.emit("initialResponse", ticket);
    }
    else {
        console.log(`${fileName} Not Found`);

        ticket.clientResponses[ip.address()] = {
            "hasCreatedFile": false
        };

        ticket.lastModifiedBy = ip.address();

        socket.emit("initialResponse", ticket);
    }
};

function changed(ticket){
    let newHash = hashFiles.sync(ticket.file);

    if (ticket.hash === newHash) {
        ticket.clientResponses[ip.address()] = {
            "recommendSync": false
        };
    
        ticket.lastModifiedBy = ip.address();
    
        socket.emit("initialResponse", ticket);
    }
    else {
        ticket.clientResponses[ip.address()] = {
            "recommendSync": true
        };
    
        ticket.lastModifiedBy = ip.address();
    
        socket.emit("initialResponse", ticket);
    };
};

function deleted(ticket){
    
    ticket.clientResponses[ip.address()] = {
        "DELETE_REQUEST": true
    };

    ticket.lastModifiedBy = ip.address();

    socket.emit("initialResponse", ticket);

    console.log(`DELETE REQUEST ${ticket.file}`)
    //DELETE REQUEST()
};


socket.io.on("error", (error) => {
    console.log(error);
});