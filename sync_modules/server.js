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
  ping(socket.id);
});

io.on("pong", (socket_id) => {
  io.to("main").emit("message",`Socket ${socket_id} is up`);
});

function ping() {
  io.to("main").emit("ping");
};

io.of("main").on("connection", (socket) => {
  io.to("main").emit("message", "Welcome to Main");
});

io.listen(6200);

console.log("Server online")