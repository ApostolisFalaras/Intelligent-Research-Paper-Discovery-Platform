import pool from "./../config/db.js";


// Fetch user data based on the user's unique id 
export async function fetchUserById(id) {
    
    // Fetching everything except the password hash,
    // since this method is about displaying the user and NOT login/registration 
    const sqlQuery = `
        SELECT id, username, email, first_name, last_name, affiliation, role, bio, created_at, updated_at
        FROM users
        WHERE id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows[0] ?? null;
}

// Fetch user data based on the user's unique username
export async function fetchUserByUsername(username) {
    const sqlQuery = `
        SELECT *
        FROM users
        WHERE username = $1;
    `;

    const result = await pool.query(sqlQuery, [username]);
    return result.rows[0] ?? null;
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
        INSERT INTO users (username, email, password_hash, 
                           first_name, last_name, affiliation, role, bio, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, username, email;
    `;

    const values = [
        credentials.username,
        credentials.email,
        credentials.password_hash,
        credentials.first_name,
        credentials.last_name,
        credentials.affiliation,
        credentials.role,
        credentials.bio,
        credentials.avatar_url
    ];

    const result = await pool.query(sqlQuery, values);
    return result.rows[0] ?? null;
}