import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: `*`,
    }
});

io.on("connection", (socket) => {
  console.log(`${socket.id} Joined the queue`);

  console.log(socket.rooms); // Set { <socket.id> }

  socket.join("main");

  console.log(socket.rooms);
  
  io.to("main").emit("message", "New queue ping:");
  ping(socket);
});

io.on("pong", (socket) => {
  io.to("main").emit("message",`Socket ${socket.id} is up`);
});

let ping = (socket) => {
  io.to("main").emit("ping");
};

io.listen(6200);

console.log("Server online")