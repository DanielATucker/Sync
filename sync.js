// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { Server } from "socket.io";
import strftime from "strftime";

var sqlite3 = require('sqlite3');
const fs = require('fs');
var ip = require('ip');


let myip = null;

try {
    myip = ip.address("Tailscale")
} catch {
    myip = ip.address("tailscale0");
};


//init socketio


let clientList = [];

let ApprovedFiles = {};


function init_socketio() {
  console.log(`Initializing socket.io`);

  const io = new Server({
    cors: {
      origin: `*`,
    }
  });

  io.on("connection", (socket) => {
    console.log(`${socket.id} Joined the queue`);

    socket.join("main");
    
    io.of("main").on("connection", (socket) => {
      io.to("main").emit("message", "Welcome to Main");
    });

    io.to("main").emit("message", "New queue ping:");

    ping(socket.id);

    socket.on("pong", (ip) => {
      io.to("main").emit("message",`Client ${socket.id} is up`);

      addClient(ip, socket.id);
    });

    socket.on("get_manifest", () => {
      get_manifest(io);
    });
  });

  function ping() {
    io.to("main").emit("ping");
  };

  function addClient(ip, id) {
    if (JSON.stringify(clientList).includes(ip)) {
      clientList.forEach((client, count) =>{
        if (client.client_ip === ip) {
          if (client.socket_id !== id) {
            // if id is different, update it
  
            clientList[count].socket_id = id;

            console.log(`New Client list ${JSON.stringify(clientList, null, 2)}`);

            add_manifest(clientList);
          };
        };
      });
    }
    else {
      let client = {
        "client_ip": ip,
        "socket_id": id
      };

      clientList.push(client);

      add_manifest(clientList);
    };
  };

  io.listen(6200);

  console.log("Server online");
};

function add_manifest(clientList) {
  let manifest = {
    "server": ip.address(),
    "clientList": clientList
  };

  let db = load_manifest();

  try {
    clientList.forEach((client)=> {
      let query = `INSERT or REPLACE INTO client_list (client_ip, socket_id, server_ip) \
      VALUES (${JSON.stringify(client.client_ip)}, ${JSON.stringify(client.socket_id)}, ${JSON.stringify(client.client_ip)})`
    
      db.run(query);
    });
  }
  catch (err) {
    console.log(`ERROR ${err}`);
  };
};

function get_manifest(io) {
  let db = load_manifest();

  db.each("SELECT client_ip AS c_ip, socket_id AS s_id, server_ip AS s_ip FROM client_list", (err, row) => {
    let client_ip = row.c_ip;
    let socket_id = row.s_id;
    let server_ip = row.s_ip;

    let clientList = {
      "socket_id": socket_id,
      "client_ip": client_ip
    };

    let manifest = {
      "server_ip": server_ip,
      "clientList": clientList
    }

    io.to("main").emit("return_manifest", manifest);
  });
};

function does_manifest_exist() {
  let manifest_file = "./manifest/manifest.db";

  if (fs.existsSync(manifest_file)) {
    console.log(`Found Manifest`);

    let db = load_manifest();

    return db;
  }
  else {
    console.log(`Could not find Manifest, Creating one now`);
    
    let db = create_manifest();

    return db;
  };
};

function create_manifest() {
  let db = new sqlite3.Database('./manifest/manifest.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.log("Getting error " + err);
    }
    else {
      //Manifest exists
    
      console.log(`Database created`);

      let query = `CREATE TABLE IF NOT EXISTS client_list (\
        client_ip TEXT NOT NULL,\
        socket_id TEXT NOT NULL,\
        server_ip TEXT NOT NULL,\
        id INT AUTO_INCREMENT PRIMARY KEY\
      );`
      
      try {
        db.run(query);

        console.log(`Created client_list table`);

        db.close();
      }
      catch (err) {
        console.log(err);
      };

      let query2 = `CREATE TABLE IF NOT EXISTS Approved_Files ( \
        id INT AUTO_INCREMENT PRIMARY KEY, \
        file_location TEXT NOT NULL, \
        file_name TEXT NOT NULL, \
        file_hash TEXT NOT NULL, \
        name_hash TEXT NOT NULL, \
        manifest_uuid TEXT NOT NULL, \
        last_modified TEXT NOT NULL, \
        deleted TEXT NOT NULL, \
        recycled TEXT NOT NULL, \
        original_server_ip TEXT NOT NULL\
      );`

      try {
        db.run(query2);

        console.log(`Created Approved_Files table`);

        db.close();
      }
      catch (err) {
        console.log(err);
      };
      
      return db;
    }
  });  
};

function load_manifest(){
  let db = new sqlite3.Database('./manifest/manifest.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.log("Getting error " + err);
    }
    else {
      //Manifest exists
    };
  });

  return db;
};

//Start

const Start = new Promise((resolve, reject) => {
  let db = does_manifest_exist();

  resolve(db);
});

Start.then((db) => {
  init_socketio();
});