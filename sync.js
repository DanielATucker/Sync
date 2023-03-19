// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { Server } from "socket.io";
import strftime from "strftime";

import Database from "better-sqlite3";
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
    socket.emit("message", "Welcome to Main");

    // io.to("main").emit("message", "New queue ping:");

    ping(socket.id);

    socket.on("pong", (ip) => {
      io.to("main").emit("message",`Client ${socket.id} is up`);

      addClient(ip, socket.id);
    });

    socket.on("get_manifest", () => {
      get_manifest(socket);
    });
  });

  function ping() {
    io.to("main").emit("ping");
  };

  function addClient(ip, id) {
    let db = load_manifest();
    
    const client_list = db.prepare("SELECT * FROM client_list;").all(); 
    
    client_list.forEach((client)=> {
      delete client.id;
    });

    if (JSON.stringify(client_list).includes(ip)) {
      client_list.forEach((client, count) =>{
        if (client.client_ip === ip) {
          if (client.socket_id !== id) {
            //update id in database

            let query = `UPDATE client_list \
            SET socket_id = ? \
            WHERE client_ip = ? \
            `;
            
            let sent = db.prepare(query);
            
            sent.run(id, ip);

            console.log(`Updated client id`);
          };
        };
      });
    }
    else {
      let client = {
        "client_ip": ip,
        "socket_id": id,
        "server_ip": myip,
      };

      clientList.push(client);

      console.log(`New client`);

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
      if (! (clientList.includes(client.socket_id))) {
        let query = `INSERT INTO client_list(client_ip, socket_id, server_ip) VALUES(?, ?, ?)`;
    
        let sent = db.prepare(query);

        sent.run(client.client_ip, client.socket_id, client.server_ip);
      }
    });
  }
  catch (err) {
    console.log(`ERROR ${err}`);
  };
};

function get_manifest(socket) {
  let db = load_manifest();

  let manifest = {
    "server_ip": myip,
    "clientList": [],
    "Approved_Files": {}
  }
  
  const client_list = db.prepare("SELECT * FROM client_list;").all();

  client_list.forEach((client)=> {
    delete client.id;

    manifest.clientList.push(client);
  });

  db.close();

  console.log(`THIS SERVER manifest: ${JSON.stringify(manifest, null, 2)}`);
  
  socket.emit("return_manifest", manifest);
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
  let db;

  try {
    db = new Database('./manifest/manifest.db');

    //Manifest exists
    
    console.log(`Database created`);

    let query = `CREATE TABLE IF NOT EXISTS client_list (\
      client_ip TEXT NOT NULL,\
      socket_id TEXT NOT NULL,\
      server_ip TEXT NOT NULL,\
      id INT AUTO_INCREMENT PRIMARY KEY\
    );`
      
    try {
      db.exec(query);

      console.log(`Created client_list table`);
    }
    catch (err) {
      console.log(err);
    };

    let query2 = `CREATE TABLE IF NOT EXISTS Approved_Files ( \
      id INT AUTO_INCREMENT PRIMARY KEY, \
      manifest_hash TEXT NOT NULL, \
      file_location TEXT NOT NULL, \
      file_name TEXT NOT NULL, \
      file_hash TEXT NOT NULL, \
      name_hash TEXT NOT NULL, \
      duplicate_no TEXT, \
      last_modified TEXT, \
      deleted TEXT, \
      recycled TEXT, \
      original_server_ip TEXT NOT NULL\
    );`

    try {
      db.exec(query2);
      console.log(`Created Approved_Files table`);
    }
    catch (err) {
      console.log(err);
    };
      
    db.close();

    return db;
  }
  catch (err){
    console.log(err);
  }
};


function load_manifest(){
  const db = new Database('./manifest/manifest.db');
  
  db.pragma('journal_mode = WAL');
  
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