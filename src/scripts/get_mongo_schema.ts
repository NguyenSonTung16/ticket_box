import * as mongoose from 'mongoose';

async function run() {
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
    MongoDB: mongoSchema
  };

  const fs = require('fs');
  fs.writeFileSync('db_schema_mongo.json', JSON.stringify(output, null, 2));
  console.log("Schema written to db_schema_mongo.json");
}

run().catch(console.error);
