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
  const info = await AppDataSource.query(`SELECT "showId", cover_image_url, image_url FROM concert_info`);
  console.log('Concert Info:', info);
  await AppDataSource.destroy();
}
run();
