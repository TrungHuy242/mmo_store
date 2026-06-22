import { Client } from 'pg';

const connectionString = 'postgresql://postgres:huy0610@localhost:5432/postgres';
const client = new Client({ connectionString });

try {
  await client.connect();
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname='mmostore';");
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE mmostore');
    console.log('Created database mmostore');
  } else {
    console.log('Database mmostore already exists');
  }
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
