const { Client } = require('pg');
const client = new Client({ user: 'ticketbox', password: 'password', host: 'localhost', port: 5434, database: 'ticketbox_db' });
client.connect().then(() => client.query('SELECT status, "reservedBy" FROM seat_inventory WHERE "seatNo"=\'A-1\'')).then(res => console.log(res.rows)).finally(() => client.end());
