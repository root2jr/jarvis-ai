import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = process.env;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error(" MongoDB Connection Failed:", error));

const reminderSchema = new mongoose.Schema({
  name: String,
  time: String,
});
const Reminder = mongoose.model("Reminder", reminderSchema);

app.get("/", (req, res) => {
  res.send(" JARVIS Reminder Backend is Live!");
});

app.post("/reminders", async (req, res) => {
  try {
    const { name, time } = req.body;

    if (!name) return res.status(400).send("Reminder name is required.");

    const updatedReminder = await Reminder.findOneAndUpdate(
      { name },
      { time },
      { upsert: true, new: true }
    );

    console.log(" Reminder Saved:", updatedReminder);
    res.send("Reminder Saved Successfully!");
  } catch (error) {
    console.error(" Error Saving Reminder:", error);
    res.status(500).send("Server Error");
  }
});


const TaskSchema = new mongoose.Schema({
  taskname: String,
  deadline: Date,
})

const TaskModel = mongoose.model("Task", TaskSchema)







app.post("/tasks", async (req, res) => {
  try {
    const { taskname, deadline } = req.body;
   
    if (!taskname) return res.status(400).send("Task name is required.");
    if (!deadline) return res.status(400).send("Deadline is required.");

    // Attempt to convert deadline string into a Date object
    const parsedDeadline = new Date(deadline);

    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).send("Invalid deadline format.");
    }

    const updatedTask = await TaskModel.findOneAndUpdate(
      { taskname },
      { deadline: parsedDeadline },
      { upsert: true, new: true }
    );

    

    console.log(" Task Added:", updatedTask);
    res.send("Task Added");
  } catch (error) {
    console.error(" Error Adding task:", error);
    res.status(500).send("Server Error");
  }
});

const sendTelegramMessage = async (text) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
    });
    console.log(" Telegram message sent.");
  } catch (err) {
    console.error("Telegram message failed:", err.message);
  }
};

cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  console.log(` Cron Job at ${now.toLocaleTimeString('en-IN', { hour12: false })}`);

  try {
    const dueReminders = await Reminder.find({ time: currentTime });

    for (const rem of dueReminders) {
      const message = `Reminder: ${rem.name}!`;
      await sendTelegramMessage(message);
    }
  } catch (error) {
    console.error(" Error Checking Reminders:", error);
  }
});

cron.schedule('* * * * *', async () => {
  const now = new Date();
  now.setSeconds(0, 0); // zero out seconds and milliseconds
  const nextMinute = new Date(now.getTime() + 60 * 1000);
  
  console.log("⏰ Checking tasks at:", now.toISOString());

  try {
    const dueTasks = await TaskModel.find({
      deadline: {
        $gte: now,
        $lt: nextMinute,
      },
    });

    if (dueTasks.length === 0) {
      console.log("✅ No tasks due this minute.");
      return;
    }

    for (const task of dueTasks) {
      const message = `🔔 Task Reminder: "${task.taskname}" is due now!`;
      try {
        await sendTelegramMessage(message);
        console.log("📨 Reminder sent for task:", task.taskname);
      } catch (err) {
        console.error("❌ Error sending Telegram message:", err);
      }

      try {
        await TaskModel.deleteOne({ _id: task._id });
        console.log("🗑️ Task deleted:", task.taskname);
      } catch (err) {
        console.error("❌ Error deleting task:", err);
      }
    }
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
  }
});




app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
