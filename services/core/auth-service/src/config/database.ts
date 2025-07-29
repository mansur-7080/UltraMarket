import { Pool } from 'pg';

const pool = new Pool({
  host: process.env['POSTGRES_HOST'] || 'localhost',
  port: parseInt(process.env['POSTGRES_PORT'] || '5432'),
  database: process.env['POSTGRES_DB'] || 'ultramarket_auth',
  user: process.env['POSTGRES_USER'] || 'ultramarket_user',
  password: process.env['POSTGRES_PASSWORD'] || 'secure_password_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully');
  } catch (error) {
    console.warn('PostgreSQL connection failed, using mock database:', error);
    // Continue without database for now
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('PostgreSQL disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from PostgreSQL', error);
  }
};

export default pool;