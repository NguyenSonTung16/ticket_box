import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const showId = args.length > 0 ? parseInt(args[0], 10) : 39;
const sponsorId = args.length > 1 ? args[1] : '1';

if (isNaN(showId)) {
  console.error('Invalid showId. Usage: npx ts-node seed-seats-for-csv.ts <showId> <sponsorId>');
  process.exit(1);
}

async function seedSeats() {
  // Configured to match the local docker-compose settings or .env
  const client = new Client({
    user: process.env.DB_USERNAME || 'ticketbox',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ticketbox_db',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5434', 10),
  });

  try {
    await client.connect();
    console.log(`Connected to database ${client.database} on port ${client.port}`);

    const csvPath = path.join(process.cwd(), 'generated_vip_guests.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('File generated_vip_guests.csv not found. Please run generate-vip-csv.ts first.');
      return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
    // skip header
    const dataLines = lines.slice(1);

    let insertedCount = 0;
    let updatedCount = 0;

    console.log(`Starting seed for Show ID: ${showId}, Sponsor ID: ${sponsorId}`);

    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length < 3) continue;

      const seatNo = parts[0];
      const seatParts = seatNo.split('-');
      if (seatParts.length !== 2) continue;

      const seatRow = seatParts[0];
      const seatNum = seatParts[1];

      // Check if seat exists
      const checkQuery = `SELECT "seatId" FROM seat_inventory WHERE "concert_id" = $1 AND "seatNo" = $2`;
      const checkRes = await client.query(checkQuery, [showId, seatNo]);

      if (checkRes.rows.length === 0) {
        // Insert new seat
        const insertQuery = `
          INSERT INTO seat_inventory ("concert_id", "zone", "seatNo", "status", "sponsorId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;
        await client.query(insertQuery, [showId, 'SVIP', seatNo, 'AVAILABLE', sponsorId]);
        insertedCount++;
      } else {
        // Update existing seat's sponsorId
        const updateQuery = `
          UPDATE seat_inventory SET "sponsorId" = $1 WHERE "seatId" = $2
        `;
        await client.query(updateQuery, [sponsorId, checkRes.rows[0].seatId]);
        updatedCount++;
      }
    }

    console.log(`Successfully completed seed/update for show ${showId}.`);
    console.log(`- Inserted new seats: ${insertedCount}`);
    console.log(`- Updated existing seats: ${updatedCount}`);

  } catch (err) {
    console.error('Error seeding seats:', err);
  } finally {
    await client.end();
  }
}

seedSeats();
