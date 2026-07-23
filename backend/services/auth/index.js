import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import router from "./routes/auth.routes.js";
import orgRouter from "./routes/org.routes.js";
dotenv.config();
const app = express();
app.use(express.json());
const port=process.env.PORT 



app.get("/", (req, res) => {
  res.status(200).json({
    service: "auth",
    status: "ok"
  });
});
app.use("/",router)
app.use("/",orgRouter)
app.listen(port, () => {
    connectDB()
  console.log(
    `auth service running on ${port}`
  );
});
