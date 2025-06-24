import express from "express";
import dotenv from "dotenv";
import Routes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/", Routes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
