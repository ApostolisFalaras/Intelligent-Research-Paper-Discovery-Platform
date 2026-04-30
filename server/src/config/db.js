import pg from "pg";
const { Pool } = pg;

// Creating a pool of PostgreSQL database connections
console.log(typeof process.env.DB_PASSWORD)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

export default pool;