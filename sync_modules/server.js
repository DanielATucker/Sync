// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { Server } from "socket.io";
import strftime from "strftime";

const io = new Server({
    cors: {
        origin: `*`,
    }
});

let clientList = [];
let jobs = {};

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

    let client = {
      "client ip": ip,
      "socket_id": socket.id
    };

    addClient(client);
  });

  socket.on("newJob", (fileName) => {
    let newTicket = {
      "jobName": fileName,
      "file": fileName.split('_')[0],
      "createdTime": fileName.split('_')[1],
      "receivedTime": strftime("%y%m%d_%X"),
      "startedSync": false,
      "clientResponses": {},
      "firstResult": null,
      "secondResult": null,
      "completed": false,
      "completedTime": null,
      "raiseError": null,
      "lastModifiedBy": "Server"
    };

    jobs[fileName] = newTicket;

    console.log(`New Job:`);

    console.log(`Ticket: ${JSON.stringify(newTicket, null, 2)}`);

    io.to("main").emit("job", newTicket);
  });

  socket.on("initialResponse", (ticket) => {
    console.log(`New Ticket from ${ticket.lastModifiedBy}:`);
    console.log(`Ticket: ${JSON.stringify(ticket, null, 2)}`);
  });
});


function ping() {
  io.to("main").emit("ping");
};

function addClient(ip) {
  clientList.push(ip);

  console.log(`New Client list ${JSON.stringify(clientList, null, 2)}`);
};


io.listen(6200);

console.log("Server online")