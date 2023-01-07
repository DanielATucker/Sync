// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: `*`,
    }
});

let clientList = [];

io.on("connection", (socket) => {
  console.log(`${socket.id} Joined the queue`);

  socket.join("main");
  
  io.of("main").on("connection", (socket) => {
    io.to("main").emit("message", "Welcome to Main");
  });

  io.to("main").emit("message", "New queue ping:");


  ping(socket.id);

  socket.on("pong", (ip) => {
    io.to("main").emit("message",`Client ${ip} is up`);
    addClient(ip);
  });
});


function ping() {
  io.to("main").emit("ping");
};

function addClient(ip) {
  clientList.concat(ip);

  console.log(`New Client list ${clientList}`);
};


io.listen(6200);

console.log("Server online")