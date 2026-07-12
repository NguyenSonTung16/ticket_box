const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5434,
  username: 'ticketbox',
  password: 'password',
  database: 'ticketbox_db'
});

ds.initialize().then(async () => {
  await ds.query('DROP TABLE IF EXISTS event_ticket_types CASCADE');
  console.log('Dropped event_ticket_types');
  await ds.query('DROP TABLE IF EXISTS ticket_types CASCADE');
  console.log('Dropped ticket_types');
  
  // Verify remaining tables
  const tables = await ds.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log('Remaining tables:', tables.map(t => t.table_name).join(', '));
  
  await ds.destroy();
}).catch(e => { console.error(e.message); process.exit(1); });
