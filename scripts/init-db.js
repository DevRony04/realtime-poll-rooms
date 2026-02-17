const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Reading schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Running schema migration...');
            await client.query('BEGIN');
            await client.query(schemaSql);
            await client.query('COMMIT');
            console.log('Schema applied successfully!');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
