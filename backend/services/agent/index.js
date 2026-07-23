import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";
import { startAutonomousGoalExecutor } from "./utils/autonomousGoalExecutor.js";
dotenv.config();
const app = express();
app.use(express.json());
const port=process.env.PORT

app.use("/",router);

app.use((err, req, res, next) => {

  console.error(err);

  if (err.status) {

    return res
      .status(err.status)
      .json(err.data);

  }

  return res
    .status(500)
    .json({

      success: false,

      message: err.message || "Internal Server Error"

    });

});

app.listen(port, () => {
  connectDB();
  startAutonomousGoalExecutor();
  console.log(
    `agent service running on ${port}`
  );
});
