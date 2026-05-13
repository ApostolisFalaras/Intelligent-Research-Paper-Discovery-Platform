import express from "express";
import paperRouter from "./routes/paperRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import recommendationsRouter from "./routes/recommendationRoutes.js";
import authorRouter from "./routes/authorRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sessionMiddleware } from "./config/session.js";
import { authMiddleware, optionalAuthMiddleware } from "./middlewares/authMiddleware.js";

const app = express();

// Parse request JSON body in the req.body field 
app.use(express.json());

// Append session data to request, through req.session 
app.use(sessionMiddleware);

// Redirect every request to the appropriate router based on the URL prefix
app.use("/api/auth", authRouter);

app.use("/api/search", optionalAuthMiddleware, searchRouter);
app.use("/api/papers", paperRouter);
app.use("/api/authors", authorRouter);

// To perform user- and recommendation-related operations, the user needs to be authenticated
app.use("/api/users", authMiddleware, userRouter);
app.use("/api/recommendations", authMiddleware, recommendationsRouter);


app.get("/", (req, res) => {
    res.send("API is running");
});

app.use(errorHandler);

export default app;