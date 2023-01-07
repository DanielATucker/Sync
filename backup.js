require("dotenv").config();
var strftime = require('strftime');
var ip = require('ip');

const CronJob = require("cron").CronJob;
const Rsync = require("rsync");
const https = require("https");

const hound = require('hound');

process.title = "node-backup-script";

// The value of process.platform will be:
// Windows: win32
// Mac: darwin
// Ubuntu: linux
const syncProgram = process.platform === "win32" ? "robocopy" : "rsync";


let watcher = hound.watch(process.env.SOURCE_DIR);

watcher.on('create', function(file, stats) {
  console.log(file + ' was created');
  
  console.log(`Stats: ${JSON.stringify(stats, null, 2)}`);

  queue(file, "Created");
});

watcher.on('change', function(file, stats) {
  console.log(file + ' was changed');
  console.log(`Stats: ${JSON.stringify(stats, null, 2)}`);

  queue(file, "Changed");
});

watcher.on('delete', function(file) {
  console.log(file + ' was deleted');

  queue(file, "Deleted");
});

queue = (file, event) => {
  let Event = {
    name: file,
    originalHost: ip.address(),
    eventType: event,
    createdTime: strftime('%y%m%d_%X'),
    finished: false,
    finishedTime: null
  }

  console.log(`Event ${JSON.stringify(Event, null, 2)}`)
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