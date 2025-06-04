import express from "express";
import dotenv from "dotenv";
import Routes from "./routes/index";
import { globalErrorHandler } from "./middlewares/errorHandler";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/", Routes);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
