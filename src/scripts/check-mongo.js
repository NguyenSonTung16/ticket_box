const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb://ticketbox:password@localhost:27018/ticketbox_db?authSource=admin";
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const shows = db.collection('showinfos');
    const all = await shows.find({}).toArray();
    console.dir(all, {depth: null});
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.dir);
