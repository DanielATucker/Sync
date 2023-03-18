const options = { verbose: console.log };
const uri = 'file:test.db?node=primary&bind=tcp://0.0.0.0:1234';
const db = require('better-sqlite3-litesync')(uri, options);

db.on('ready', function() {
  db.exec('CREATE TABLE IF NOT EXISTS users (name, email)');
});

db.on('sync', function() {
  console.log('the database received updates');

  const rows = db.prepare('SELECT * FROM users').all();
  for (var row of rows) {
    console.log(row.name, row.email);
  }
});