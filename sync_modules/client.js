import { io } from "socket.io-client";

const socket = io("100.69.19.3", {       
});


socket.on("ping", () => {
    socket.emit("pong");   
});

socket.io.on("error", (error) => {
    console.log(error);
});
