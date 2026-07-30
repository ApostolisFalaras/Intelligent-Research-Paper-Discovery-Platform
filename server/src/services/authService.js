import { fetchUserByUsername, fetchUserByEmail, createUser } from "./../repositories/userRepository.js";
import { AppError } from "./../utils/AppError.js";
import bcryptjs from "bcryptjs";

// Login Service
export async function login(credentials) {
    const username = credentials.username;
    const password = credentials.password;

    // Checking for missing authentication credentials
    if (!username || !password) {
        throw new AppError("'username', and 'password' are required", 400);
    }

    // We fetch user credentials based on the globally unique username
    const user = await fetchUserByUsername(username);
    if (!user)
        throw new AppError("Invalid credentials", 401);

    const isPassWordMatch = await bcryptjs.compare(password, user.password_hash);
    
    // Invalid password
    if (!isPassWordMatch)
        throw new AppError("Invalid credentials", 401);

    return {
        id: user.id,
        username: user.username,
        email: user.email,
    };
} 

// Register service 
export async function register(credentials) {
    const firstName = credentials.firstName;
    const lastName = credentials.lastName;
    const username = credentials.username;
    const email = credentials.email;
    const password = credentials.password;
    const affiliation = credentials.affiliation;
    const location = credentials.location;
    const role = credentials.role;

    // Checking for missing authentication credentials
    if (!username || !email || !password)
        throw new AppError("'username', 'email' and 'password' are required", 400);

    
    // Checking if a registered user has taken up the input username
    const existingUserWithUsername = await fetchUserByUsername(username);
    if (existingUserWithUsername)
        throw new AppError("'username' is already registered", 409);

    // Checking if a registered user has taken up the input email
    const existingUserWithEmail = await fetchUserByEmail(email);
    if (existingUserWithEmail)
        throw new AppError("'email' is already registered", 409);

    // Hash the password and store the user in the DB
    const passwordHash = await bcryptjs.hash(password, 12);

    const user = await createUser({ 
        username: username, 
        email: email, 
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        affiliation: affiliation,
        location: location,
        role: role,
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
    };

}