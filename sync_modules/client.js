import { io } from "socket.io-client";

const socket = io("http://100.69.19.3:6200");

socket.on("connect", () => {
    console.log("Connected to server")  
});

socket.on("message", (message) => {
    console.log(message);
});

socket.on("ping", () => {
    socket.emit("pong");  
});

socket.io.on("error", (error) => {
    console.log(error);
});
