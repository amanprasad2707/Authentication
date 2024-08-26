import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
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

const corsOptions = {
  origin: 'http://localhost:5173', // Specify your frontend URL
  credentials: true, // This allows the server to accept credentials in requests
};

app.use(cors(corsOptions));
app.use(express.json());  // allows us to parse incoming requests will json payloads
app.use(cookieParser()); // allows us to parse incoming cookies


app.use('/api/auth', authRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});