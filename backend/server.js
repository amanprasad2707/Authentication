import express from "express";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./database/connectDB.js";
import authRoutes from "./routes/auth.route.js"
const app = express();
configDotenv()
const PORT = process.env.PORT;
connectDB();
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.json());  // allows us to parse incoming requests will json payloads
app.use(cookieParser()); // allows us to parse incoming cookies

app.use('/api/auth', authRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});