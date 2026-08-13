import pool from "./../config/db.js";


// Fetch user data based on the user's unique id 
export async function fetchUserById(id) {
    
    // Fetching everything except the password hash,
    // since this method is about displaying the user and NOT login/registration 
    const sqlQuery = `
        SELECT *
        FROM users
        WHERE id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows[0] ?? null;
}

export async function updateUserById(id, updates) {
    const columnMap = {
        username: "username",
        email: "email",
        passwordHash: "password_hash",
        firstName: "first_name",
        lastName: "last_name",
        affiliation: "affiliation",
        location: "location",
        role: "role",
        bio: "bio",
        avatarURL: "avatar_url"
    };

    const setClauses = [];
    const values = [];

    for (const [field, value] of Object.entries(updates)) {
        const column = columnMap[field];

        if (!column) {
            continue;
        }

        values.push(value);
        setClauses.push(`${column} = $${values.length}`);
    }

    
    if (setClauses.length === 0) {
        return null;
    }

    values.push(id);
    const userIdIndex = values.length;

    const sqlQuery = `
        UPDATE users
        SET ${setClauses.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${userIdIndex};
    `;

    const result = await pool.query(sqlQuery, values);

    return result.rowCount;
}  

// User deletes their profile
export async function deleteUserById(id) {
    const sqlQuery = `
        DELETE FROM users
        WHERE id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rowCount;
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
                           first_name, last_name, affiliation, location, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email;
    `;

    const values = [
        credentials.username,
        credentials.email,
        credentials.password_hash,
        credentials.first_name,
        credentials.last_name,
        credentials.affiliation,
        credentials.location,
        credentials.role
    ];

    const result = await pool.query(sqlQuery, values);
    return result.rows[0] ?? null;
}

// Update user login time
export async function upsertUserLoginTime(id) {
    const sqlQuery = `
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rowCount; 
}