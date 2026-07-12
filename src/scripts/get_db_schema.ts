import { DataSource } from 'typeorm';
import * as mongoose from 'mongoose';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5434,
  username: 'ticketbox',
  password: 'password',
  database: 'ticketbox_db',
});

async function run() {
  await AppDataSource.initialize();
  const tables = await AppDataSource.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  const schema = {};
  
  for (const t of tables) {
    const cols = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [t.table_name]);
    schema[t.table_name] = cols;
  }
  
  await AppDataSource.destroy();

  const mongoUri = "mongodb://admin:password@localhost:27017/ticketbox_db?authSource=admin";
  let mongoSchema = {};
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      const sample = await db.collection(c.name).findOne();
      mongoSchema[c.name] = sample ? Object.keys(sample).map(k => ({ field: k, type: typeof sample[k] })) : [];
    }
  } catch (e) {
    console.error("Mongo error:", e);
  } finally {
    await mongoose.disconnect();
  }

  const output = {
    Postgres: schema,
    MongoDB: mongoSchema
  };

  const fs = require('fs');
  fs.writeFileSync('db_schema_output.json', JSON.stringify(output, null, 2));
  console.log("Schema written to db_schema_output.json");
}

run().catch(console.error);
