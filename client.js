// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs')
var ip = require('ip');
var hashFiles = require('hash-files');


import { io } from "socket.io-client";
import strftime from "strftime";
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()


let myip = null;

try {
    myip = ip.address("Tailscale")
} catch {
    myip = ip.address("tailscale0");
};


let serverList = [myip];

if (! (typeof process.env.Server_ip === null)) {
    serverList.concat(process.env.Server_ip);
};

serverList.forEach((serverIp) => {
    Start(serverIp)
});

function Start(serverIp) {
    const socket = io(`http://${serverIp}:6200`);

    socket.on("connect", () => {
        console.log("Connected to server");
      
        setTimeout(() => socket.emit("get_manifest"), 5000);
    });

    socket.on("message", (message) => {
        console.log(message);
    });

    socket.on("ping", () => {
        console.log(`Received ping`);
        socket.emit("pong", myip);  
    });

    socket.on("return_manifest", (manifest) => {
        if (manifest.server_ip !== myip) {
            if (serverList.includes(manifest.server_ip)) {
            }
            else {
                console.log(`Did not find ${manifest.server_ip} in serverList, adding now.`);

                serverList.push(JSON.parse(JSON.stringify(manifest.server_ip)));
                
                console.log(`connecting to new server`);

                try {
                    Start(manifest.server_ip)
                }
                catch (err) {
                    console.log(err);
                }
            };            
        }
    });

    socket.io.on("error", (error) => {
        console.log(error);
    });
};
