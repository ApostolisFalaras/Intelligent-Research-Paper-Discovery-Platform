import "dotenv/config"; // side-effect import to setup process.env before app.js loads routes/controllers/services/repositories
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});