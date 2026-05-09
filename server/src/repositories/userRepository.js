import pool from "./../config/db.js";

// Fetch user data based on the user's unique username
export async function fetchUserByUsername(username) {
    const sqlQuery = `
        SELECT *
        FROM users
        WHERE username = $1;
    `;

    const result = await pool.query(sqlQuery, [username]);
    return result.rows[0];
}

// Fetch user data based on the user's unique email
export async function fetchUserByEmail(email) {
    const sqlQuery = `
        SELECT *
        FROM users
        WHERE email = $1;
    `;

    const result = await pool.query(sqlQuery, [email]);
    return result.rows[0] ?? null;
}

// Create user upon registration
export async function createUser(credentials) {
    const sqlQuery = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at;
    `;

    const result = await pool.query(
        sqlQuery, 
        [credentials.username, credentials.email, credentials.passwordHash]
    );
    return result.rows[0] ?? null;
}