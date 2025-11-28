import dotenv from 'dotenv';
dotenv.config(); // ← MUST BE FIRST

import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // ← NOW SAFE
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});


    

//middleware
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);    
});
