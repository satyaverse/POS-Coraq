import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  const dbName = process.env.DB_NAME || 'coraq_pos';
  console.log(`Connecting to MySQL to initialize database: ${dbName}...`);
  
  // Connect without database selected first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true,
  });

  try {
    console.log(`Creating database ${dbName} if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    
    const schemaPath = path.resolve(__dirname, '../../../database/migrations/001_create_core_schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seeds/001_seed_initial_data.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('Executing core schema migration...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('Core schema created successfully.');
    } else {
      console.warn(`Schema file not found at ${schemaPath}`);
    }

    if (fs.existsSync(seedPath)) {
      console.log('Executing initial data seed...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('Initial data seeded successfully.');
    } else {
      console.warn(`Seed file not found at ${seedPath}`);
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDB();
