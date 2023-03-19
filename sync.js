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
    let db = load_manifest();
    
    const client_list = db.prepare("SELECT * FROM client_list;").all(); 
    
    client_list.forEach((client)=> {
      delete client.id;
    });

    if (JSON.stringify(client_list).includes(ip)) {
      client_list.forEach((client, count) =>{
        if (client.client_ip === ip) {
          if (client.socket_id !== id) {
            // if id is different, update it
  


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

      console.log(`New Client list ${JSON.stringify(clientList, null, 2)}`);

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
      let query = `INSERT INTO client_list(client_ip, socket_id, server_ip) VALUES(?, ?, ?)`;
    
      let sent = db.prepare(query);

      sent.run(client.client_ip, client.socket_id, client.server_ip);
    });
  }
  catch (err) {
    console.log(`ERROR ${err}`);
  };
};

function get_manifest(io) {
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


  /* APPROVED FILES FORMAT
  const Approved_files_row = db.prepare("SELECT id, manifest_hash, file_location, file_hash, name_hash, duplicate_no, last_modified, deleted, recycled, original_server_ip FROM Approved_Files");

  let manifest_hash = Approved_files_row.manifest_hash;
  let file_location = Approved_files_row.file_location;
  let file_name = Approved_files_row.file_name;
  let file_hash = Approved_files_row.file_hash;
  let name_hash = Approved_files_row.name_hash;
  let duplicate_no = Approved_files_row.duplicate_no;
  let last_modified = Approved_files_row.last_modified;
  let deleted = Approved_files_row.deleted;
  let recycled = Approved_files_row.recycled;
  let original_server_ip = Approved_files_row.original_server_ip;

  let file_manifest = {
    original_server_ip: {
      name_hash: {
        "manifest_hash": manifest_hash,
        "file_location": file_location,
        "file_name": file_name,
        "file_hash":file_hash,
        "name_hash": name_hash,
        "duplicate_no": duplicate_no,
        "last_modified": last_modified,
        "deleted": deleted,
        "recycled": recycled,
        "original_server_ip": original_server_ip
      }
    }
  };
  */

  console.log(`THIS SERVER manifest: ${JSON.stringify(manifest, null, 2)}`);
  
  db.close();
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