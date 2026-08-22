import express from "express";
import paperRouter from "./routes/paperRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import authorRouter from "./routes/authorRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import topicRouter from "./routes/topicRoutes.js";
import recommendationRouter from "./routes/recommendationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sessionMiddleware } from "./config/session.js";
import { authMiddleware, optionalAuthMiddleware } from "./middlewares/authMiddleware.js";
import path from "path";

const app = express();

// Parse request JSON body in the req.body field 
app.use(express.json());

// Append session data to request, through req.session 
app.use(sessionMiddleware);

app.use("/uploads", express.static(path.resolve("uploads")));

// Redirect every request to the appropriate router based on the URL prefix
app.use("/api/auth", authRouter);

app.use("/api/search", optionalAuthMiddleware, searchRouter);
app.use("/api/papers", optionalAuthMiddleware, paperRouter);
app.use("/api/authors", authorRouter);
app.use("/api/topics", topicRouter);

// To perform user-related operations, the user needs to be authenticated
app.use("/api/users", authMiddleware, userRouter);


app.use("/api/recommendations", recommendationRouter);


app.get("/", (req, res) => {
    res.send("API is running");
});

app.use(errorHandler);

export default app;