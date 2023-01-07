import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: `*`,
    }
});

io.on("connection", (socket) => {
  console.log(`${socket.id} Joined the queue`);

  socket.join("main");
  
  socket.to("main").emit("message", `New queue ping:`);
  ping(socket);
});

io.on("pong", (socket) => {
  socket.to("main").emit("message",`Socket ${socket.id} is up`);
});

let ping = (socket) => {
  socket.to("main").emit("ping");
};

io.listen(6200);

console.log("Server online")