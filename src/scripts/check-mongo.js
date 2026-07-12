const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb://ticketbox:password@localhost:27018/ticketbox_db?authSource=admin";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('ticketbox_db');
    const shows = database.collection('showinfos');
    const all = await shows.find({}).toArray();
    console.dir(all, {depth: null});
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
