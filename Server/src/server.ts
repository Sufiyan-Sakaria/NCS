import express from "express";
import dotenv from "dotenv";
import Routes from "./routes/index";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/", Routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
