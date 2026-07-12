const { Client } = require('pg');
const client = new Client({
  user: 'ticketbox',
  password: 'password',
  host: 'localhost',
  port: 5434,
  database: 'ticketbox_db',
});
client.connect().then(() => {
  return client.query('SELECT status, "errorCount", "errorDetails" FROM import_jobs ORDER BY "createdAt" DESC LIMIT 1');
}).then(res => {
  console.log(JSON.stringify(res.rows[0], null, 2));
  client.end();
}).catch(console.error);
