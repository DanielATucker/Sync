// Allow require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

require("dotenv").config();
var strftime = require('strftime');
var ip = require('ip');
var hashFiles = require('hash-files');

const CronJob = require("cron").CronJob;
const Rsync = require("rsync");
const https = require("https");

const hound = require('hound');

export default function Backup(socket) {
  process.title = "node-backup-script";

  // The value of process.platform will be:
  // Windows: win32
  // Mac: darwin
  // Ubuntu: linux
  process.platform === "win32" ? "robocopy" : "rsync";


  let watcher = hound.watch(process.env.SOURCE_DIR);

  watcher.on('create', function(file, stats) {
    console.log(file + ' was created');
    
    queue(file, "Created");
  });

  watcher.on('change', function(file, stats) {
    console.log(file + ' was changed');

    let fileHash = hashFiles.sync(file);

    file = file +  "_" + fileHash;

    queue(file, "Changed");
  });

  watcher.on('delete', function(file) {
    console.log(file + ' was deleted');

    queue(file, "Deleted");
  });

  let queue = (file, event) => {
    socket.emit("newJob", `${event}_${file}_${strftime("%y%m%d_%X")}`);
  };
};

/*
job1 = new Rsync()
.executable(syncProgram)
.flags("a")
.source(process.env.SOURCE_DIR)
.destination(process.env.DESTINATION_DIR);
  
job1.execute((error, code, cmd) => {
  let result;
  if (error) {
    result = `Code ${code} ${error?.message}`;
  } else {
    result = "Backup complete";
  }

  const currentDate = new Date().toISOString();
  console.log(`${currentDate}: ${result}\n`);
});

*/