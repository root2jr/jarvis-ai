import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from "socket.io";
import { exec } from "child_process";
import path from 'path';
import fs from 'fs'



dotenv.config();
const app = express();
app.use(cors({
    origin: 'https://j-a-r-v-i-s-ai.netlify.app',
    methods: ['GET', 'POST','PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());


const __dirname = path.resolve(); // Needed for ES modules
app.use('/audio', express.static(path.join(__dirname, 'public')));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});



io.on("connection", (socket) => {
  console.log("🔥 A user connected");

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// ✅ Attach Socket.io to the server


const { MONGO_URI, PORT, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = process.env;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error(" MongoDB Connection Failed:", error));

const reminderSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  username: String,
  intent: String,
  datetime: Date,
  task: String,
});
const Reminder = mongoose.model("Reminder", reminderSchema);

app.get("/", (req, res) => {
  res.send(" JARVIS Reminder Backend is Live!");
});


let usersname = "";

app.post("/reminders", async (req, res) => {
  try {
    const { username, datetime, intent, task } = req.body;
    usersname = username;

    if (!username) return res.status(400).send("Reminder name is required.");
    const updatedReminder = await new Reminder({
      username,
      datetime,
      intent,
      task
    });
    await updatedReminder.save();

    console.log(" Reminder Saved:", updatedReminder);
    res.send("Reminder Saved Successfully!");
  } catch (error) {
    console.error(" Error Saving Reminder:", error);
    res.status(500).send("Server Error");
  }
});


const TaskSchema = new mongoose.Schema({
  username: String,
  intent: String,
  datetime: Date,
  task: String,
})

const TaskModel = mongoose.model("Task", TaskSchema)







app.post("/tasks", async (req, res) => {
  try {
    const { username, datetime, intent, task } = req.body;
    usersname = username;

    if (!username) return res.status(400).send("Reminder name is required.");
    const updatedTask = await new TaskModel({
      username,
      datetime,
      intent,
      task
    });
    await updatedTask.save();



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



cron.schedule("* * * * *", async () => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  
  console.log(`⏰ Cron Job running at IST ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  try {
    const dueReminders = await Reminder.find({
      datetime: { $gte: now, $lte: new Date(now.getTime() + 59000) }
    });

    for (const rem of dueReminders) {
      const message = `Reminder: ${rem.task}`;
      io.emit("reminder", { task: rem.task });

      await sendTelegramMessage(message);

      // ✅ Save file in the correct location
      const filename = `reminder_${rem._id}.mp3`;
      const filePath = path.join(__dirname, 'public', filename);
      
      const command = `python voice_generator.py "${message}" "${filePath.replace(/\\/g, "/")}"`;
      exec(command, (error) => {
        if (error) {
          console.error("❌ Error generating speech:", error);
          return;
        }

        const fileUrl = `http://localhost:5000/audio/${filename}`;
        io.emit("reminder_audio", { filename: fileUrl });
        console.log("✅ Reminder Audio Sent!", fileUrl);

        Reminder.findByIdAndDelete(rem._id)
          .then(() => console.log("🗑 Reminder deleted"))
          .catch((err) => console.error("❌ Error deleting reminder:", err));
        });
        scheduleFileDeletion(filePath, filename);
      }
      
  } catch (error) {
    console.error("❌ Error Checking Reminders:", error);
  }
});

function scheduleFileDeletion(filePath, filename) {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`❌ Error deleting file ${filename}:`, err);
      else console.log(`🗑 File deleted: ${filename}`);
    });
  }, 30000); // ⏳ 30 seconds
}

cron.schedule('0 9 * * *', async () => {
  console.log("🕘 Daily Task Reminder Cron Triggered!");

  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const today = new Date(istNow.toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    const upcomingTasks = await TaskModel.find({
      datetime: { $gte: today, $lt: tomorrow },
    });

    console.log('✅ Cron is checking for tasks');

    if (upcomingTasks.length === 0) {
      console.log("📆 No upcoming tasks today.");
      return;
    }

    for (const task of upcomingTasks) {
      const dueDate = new Date(task.datetime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      const message = `📌 Daily Reminder: Your task "${task.task}" is due on ${dueDate}`;
      try {
        await sendTelegramMessage(message);
        console.log("📨 Daily reminder sent for:", task.task);
      } catch (err) {
        console.error("❌ Error sending daily Telegram reminder:", err);
      }
    }
  } catch (error) {
    console.error("❌ Error in daily task reminder cron:", error);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});
