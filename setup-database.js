const { Client } = require('pg');

async function setupDatabase() {
  // First, connect to the default postgres database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create the database if it doesn't exist
    try {
      await client.query('CREATE DATABASE ocr_tts_db');
      console.log('Database ocr_tts_db created successfully');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('Database ocr_tts_db already exists');
      } else {
        throw error;
      }
    }

    await client.end();

    // Now connect to the new database to set up permissions
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'root',
      database: 'ocr_tts_db'
    });

    await dbClient.connect();
    console.log('Connected to ocr_tts_db database');

    // Grant all privileges
    await dbClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO postgres');
    await dbClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres');
    await dbClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres');
    await dbClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres');
    await dbClient.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres');

    console.log('Database permissions set up successfully');
    await dbClient.end();

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 