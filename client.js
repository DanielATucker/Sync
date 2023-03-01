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




let serverList = [JSON.parse(JSON.stringify(ip.address()))];

serverList.forEach((server) => {
    const socket = io(`http://${server}:6200`);

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
        if (!(manifest.server_ip === ip.address())) {
            console.log(`Not the same ip`);

            console.log(`Received manifest: ${JSON.stringify(manifest, null, 2)}`);

            if (serverList.includes(manifest.server_ip)) {
                console.log(`Found: ${manifest.server_ip} in serverList`);

                console.log(`server list: ${JSON.stringify(serverList, null, 2)}`);

            }
            else {
                console.log(`Did not find ${manifest.server_ip} in serverList, adding now.`);

                serverList.push(JSON.parse(JSON.stringify(manifest.server_ip)));
                
                console.log(`New server list: ${JSON.stringify(serverList, null, 2)}`);
            };            
        }
    });

    socket.io.on("error", (error) => {
        console.log(error);
    });
});