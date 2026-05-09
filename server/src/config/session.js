import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./db.js";

// Create a session store class that is compatible with express-session
const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
    store: new PgSession({
        pool: pool,
        tableName: "user_sessions",
        createTableIfMissing: true
    }),

    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false, // Don't save session unless updated
    saveUninitialized: false, // Don't save empty sessions

    cookie: {
        secure: process.env.NODE_ENV == "production", // Currently false in Development, will be set true in Production
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 7 // 7 hours until cookie expiration 
    }
});