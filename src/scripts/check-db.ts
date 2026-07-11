import { DataSource } from 'typeorm';

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
  
  // 1. Get or create an organizer
  let organizers = await AppDataSource.query(`
    SELECT id, email 
    FROM users 
    WHERE role = 'ORGANIZER' 
    LIMIT 1
  `);
  
  if (organizers.length === 0) {
    console.log('No organizer found. Updating a test_organizer to ORGANIZER role...');
    await AppDataSource.query(`UPDATE users SET role = 'ORGANIZER' WHERE email LIKE '%organizer%'`);
    organizers = await AppDataSource.query(`
      SELECT id, email 
      FROM users 
      WHERE role = 'ORGANIZER' 
      LIMIT 1
    `);
    
    if (organizers.length === 0) {
      console.log('Still no organizer. Please create one manually via UI.');
      return;
    }
  }
  const targetOrganizerId = organizers[0].id;
  console.log('Organizer:', organizers[0]);

  // 2. Get or create a concert
  let concerts = await AppDataSource.query(`SELECT id FROM concerts LIMIT 1`);
  let targetConcertId;
  if (concerts.length === 0) {
    console.log('No concerts found. Creating one...');
    const insertRes = await AppDataSource.query(`
      INSERT INTO concerts (organizer_id, status, slug, current_step) 
      VALUES ($1, 'ACTIVE', 'test-concert-revenue', 4) RETURNING id
    `, [targetOrganizerId]);
    targetConcertId = insertRes[0].id;
  } else {
    targetConcertId = concerts[0].id;
  }
  
  // Update concert to belong to organizer
  await AppDataSource.query(`UPDATE concerts SET organizer_id = $1 WHERE id = $2`, [targetOrganizerId, targetConcertId]);
  console.log(`Updated concert ${targetConcertId} to belong to organizer ${targetOrganizerId}`);

  // 3. Create mock paid invoices if none exist
  const invoices = await AppDataSource.query(`SELECT id FROM invoices WHERE concert_id = $1 AND status = 'PAID'`, [targetConcertId]);
  if (invoices.length === 0) {
    console.log('No paid invoices found. Creating mock invoices...');
    const mockUserId = targetOrganizerId;
    await AppDataSource.query(`
      INSERT INTO invoices ("userId", concert_id, "totalAmount", status) 
      VALUES 
      ($1, $2, 5000000, 'PAID'),
      ($1, $2, 2500000, 'PAID')
    `, [mockUserId, targetConcertId]);
    console.log('Mock invoices created.');
  } else {
    console.log(`Found ${invoices.length} paid invoices for concert ${targetConcertId}`);
  }

  await AppDataSource.destroy();
}
run();
