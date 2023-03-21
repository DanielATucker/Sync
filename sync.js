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
    socket.emit("message", `Welcome to Main of ${myip}`);

    // io.to("main").emit("message", "New queue ping:");

    ping(socket.id);

    socket.on("pong", (ip) => {
      // io.to("main").emit("message",`Client ${socket.id} is up`);

      addClient(ip, socket.id);
    });

    socket.on("get_manifest", () => {
      get_manifest(socket);
    });

    socket.on("socket_update_database", (update_command)=> {
      console.log(`Update Command`);

      socket_update_database(update_command, io);
    });

    socket.on("server_update_database", (version) => {
      server_update_database(version, socket);
    });

    socket.on("get_updates", (version) => {
      get_updates(version, socket);
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

  const client_list = db.prepare("SELECT * FROM client_list;").all();


  try {
    clientList.forEach((client)=> {
      if (! (JSON.stringify(client_list).includes(client.socket_id))) {
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
  let manifest_db = load_manifest();
  let database_db = load_database();

  let database_version_list = database_db.prepare("SELECT * FROM database_version_list;").all();

  let manifest = {
    "server_ip": myip,
    "clientList": [],
    "database": {
      "version_list": database_version_list
    }
  }

  const client_list = manifest_db.prepare("SELECT * FROM client_list;").all();

  client_list.forEach((client)=> {
    delete client.id;

    manifest.clientList.push(client);
  });

  manifest_db.close();

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
    
    console.log(`Manifest created`);

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

function load_database(){
  const db = new Database('./manifest/database.db');
  
  db.pragma('journal_mode = WAL');
  
  return db;
};

function does_database_exist() {
  let database_file = "./manifest/database.db";

  if (fs.existsSync(database_file)) {
    console.log(`Found Database`);

    let db = load_database();

    return db;
  }
  else {
    console.log(`Could not find Database, Creating one now`);
    
    let db = create_database();

    return db;
  };
};

function create_database() {
  let db;

  try {
    db = new Database('./manifest/database.db');
    
    console.log(`Database created`);

    let query = `CREATE TABLE IF NOT EXISTS database_version_list (\
    version TEXT NOT NULL PRIMARY KEY,\
    update_command TEXT \
    );`
      
    let query2 = `INSERT INTO database_version_list(version, update_command) VALUES(?, ?)`;
        
    try {
      db.exec(query);
    
      console.log(`Created database_version_list table`);
    
      let sent = db.prepare(query2);
    
      sent.run(0, null);
    
      console.log("Added version 0 to Database");
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

function socket_update_database(update_command, io) {
  let database_db = load_database();

  let version_list_in = database_db.prepare("SELECT * FROM database_version_list;").all();

  let last_version_in = version_list_in.slice(-1).pop();

  let version = Number(last_version_in.version) + 1;

  let query = update_command.first;

  let query2 = null;

  if (update_command.values === null){
    database_db.prepare(query).run();
  } 
  else {
    // add values for inserting data

    // query2 = 
    // db.prepare(query).run(query2);
  };

  database_db.close();

  console.log(`Sending version ${version} to all servers: ${JSON.stringify(update_command)}`);

  io.to("main").emit("server_update_database", update_command);
};

function server_update_database(version, socket) {
  console.log(`Incoming server update: ${version}`);

  let database_db = load_database();

  let version_list_in = database_db.prepare("SELECT * FROM database_version_list;").all();

  let last_version_in = version_list_in.slice(-1).pop();

  if (last_version_in === version) {
    console.log("Version match, not adding");
  }
  else {
    socket.emit("get_updates", version);
  };
};

function get_updates(version, socket) {
  let database_db = load_database();
  
  let version_list_in = database_db.prepare("SELECT * FROM database_version_list;").all();

  let last_version_in = version_list_in.slice(-1).pop();

  console.log(`last version: ${last_version_in}`);
  console.log(`version in: ${version}`);

  console.log(`version list: ${version_list_in}`);

  let update_num = version - last_version_in;

  console.log(`Update num: ${update_num}`);
};



//Start

const Start = new Promise((resolve, reject) => {
  let db = does_manifest_exist();
  
  let db2 = does_database_exist();

  resolve(db, db2);
});

Start.then((db, db2) => {
  init_socketio();
});