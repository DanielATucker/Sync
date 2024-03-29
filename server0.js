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
      "jobName": fileName.replace(/\\/g, "/"),
      "file": fileName.split('_')[1].replace(/\\/g, "/"),
      "jobType":fileName.split('_')[0],
      "hash": fileName.split('_')[2],
      "createdTime": fileName.split('_')[3] + "_" + fileName.split('_')[4],
      "receivedTime": strftime("%y%m%d_%X"),
      "startedSync": false,
      "clientResponses": {},
      "firstResult": null,
      "secondResult": null,
      "completed": false,
      "completedTime": null,
      "raiseError": null,
      "lastModifiedBy": "Server",
      "clientResponses": {}
    };

    jobs[fileName.replace(/\\/g, "/")] = newTicket;

    console.log(`New Job:`);

    console.log(`Ticket: ${JSON.stringify(newTicket, null, 2)}`);

    io.to("main").emit("job", newTicket);
  });

  socket.on("initialResponse", (ticket) => {

    if (ticket.jobType === "Created") {
      initialCreate(ticket);
    }
    else if (ticket.jobType === "Changed") {
      initialChange(ticket);
    }
    else if (ticket.jobType === "Deleted") {
      initialDelete(ticket);
    };
  });
});


function ping() {
  io.to("main").emit("ping");
};

function addClient(ip) {
  clientList.push(ip);

  console.log(`New Client list ${JSON.stringify(clientList, null, 2)}`);
};


function initialCreate(ticket) {
  let ip = ticket.lastModifiedBy
    
  let jobName = ticket.jobName

  let hasCreatedFile = ticket.clientResponses[ip].hasCreatedFile

  console.log(`New Ticket from ${ip}:`);
  console.log(`Ticket: ${JSON.stringify(ticket, null, 2)}`);

  let Responses = jobs[jobName].clientResponses;

  Responses[ip] = {
    "hasCreatedFile" : hasCreatedFile
  };

  jobs[jobName].clientResponses = Responses;

  console.log(`Jobs Status: ${JSON.stringify(jobs, null, 2)}`)
};

function initialChange(ticket) {
  let ip = ticket.lastModifiedBy;
  let jobName = ticket.jobName;

  console.log(`Initial Change Ticket: ${JSON.stringify(ticket, null, 2)}`)

  if (ticket.clientResponses[ip].recommendSync === "true") {
    console.log(`SYNC STARTING for ip: ${ip}`);

    let Responses = jobs[jobName].clientResponses;

    Responses[ip] ={
      "recommendSync" : true
    };

    jobs[jobName].clientResponses = Responses;

    console.log(`Jobs Status: ${JSON.stringify(jobs, null, 2)}`);
  }
  else {
    console.log(`NO SYNC STARTING for ip: ${ip}`);

    let Responses = jobs[jobName].clientResponses;

    Responses[ip] ={
      "recommendSync" : false
    };

    console.log(`Jobs Status: ${JSON.stringify(jobs, null, 2)}`);
  };
};

function initialDelete(ticket) {
  let ip = ticket.lastModifiedBy;

  if (ticket.clientResponses[ip].DELETE_REQUEST === "true") {
    console.log(`DELETE REQUEST for ip: ${ip}`);
  }
  else if (ticket.clientResponses[ip].recommendSync === "false") {
    console.log(`NO DELETE REQUEST for ip: ${ip}`);
  };
};

function syncHandler() {
  // load all clients
  // set default client timeout time to 0
  // if triggered 

};


io.listen(6200);

console.log("Server online");