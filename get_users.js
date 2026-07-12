const { Client } = require('pg');
const client = new Client({ user: 'ticketbox', password: 'password', host: 'localhost', port: 5434, database: 'ticketbox_db' });
async function get() {
  await client.connect();
  const res = await client.query('SELECT id, email, role FROM users LIMIT 2');
  console.log(JSON.stringify(res.rows));
  await client.end();
}
get().catch(console.error);
