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

if (! (typeof process.env.Server_ip === "undefined")) {
    serverList.push(process.env.Server_ip);
};

serverList.forEach((serverIp) => {
    Start(serverIp)
});

function Start(serverIp) {
    const socket = io(`http://${serverIp}:6200`);

    socket.on("connect", () => {
        console.log(`Connected to server ${serverIp}`);
      
        setTimeout(() => socket.emit("get_manifest"), 5000);
    });

    socket.on("message", (message) => {
        console.log(message);
    });

    socket.on("ping", () => {
        socket.emit("pong", myip);  
    });

    socket.on("return_manifest", (manifest) => {
        console.log(`${manifest.Server_ip} Manifest returned: ${manifest}`);

        let clientList = manifest.clientList;
        
        for (let client of clientList) {
            if (client.server_ip !== myip) {
                if (serverList.includes(client.client_ip)) {
                    // console.log(`IP ${client.client_ip} found, not connecting`);

                    // console.log(`ServerList ${serverList}`);
                }
                else {
                    console.log(`Did not find client ${client.client_ip} in serverList, adding now.`);
    
                    serverList.push(client.client_ip);
                    
                    console.log(`connecting to new server ${client.client_ip}`);
    
                    try {
                        Start(client.server_ip)
                    }
                    catch (err) {
                        console.log(err);
                    }
                };            
            }
            else {
                // console.log(`IP ${client.server_ip} match, not adding`);
            }
        };
    });

    socket.io.on("error", (error) => {
        console.log(error);
    });
};
