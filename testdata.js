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




function Start(serverIp) {
    const socket = io(`http://${serverIp}:6200`);

    socket.on("connect", () => {
        console.log(`Connected to server ${serverIp}`);

        let query = `CREATE TABLE IF NOT EXISTS test_data (\
        id TEXT NOT NULL PRIMARY KEY, \
        data TEXT\
        );`
        
        let update_command = {
            "first": query,
            "values": null
        };

        socket.emit("update_database", update_command);
    });

    socket.io.on("error", (error) => {
        console.log(error);
    });
};

Start("localhost")