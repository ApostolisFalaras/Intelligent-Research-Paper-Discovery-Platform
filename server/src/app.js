import express from "express";
import paperRouter from "./routes/paperRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import recommendationsRouter from "./routes/recommendationRoutes.js";
import authorRouter from "./routes/authorRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

// Parse request JSON body in the req.body field 
app.use(express.json());

// Redirect every request to the appropriate router based on the URL prefix
app.use("/api/papers", paperRouter);
app.use("/api/search", searchRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/authors", authorRouter);
app.use("/api/users", userRouter);


app.get("/", (req, res) => {
    res.send("API is running");
});

export default app;