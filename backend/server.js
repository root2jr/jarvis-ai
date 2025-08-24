import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import cron from 'node-cron';
import { spawn } from 'child_process'
import * as chrono from "chrono-node";
import nlp from 'compromise'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://j-a-r-v-i-s-ai.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;


mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((error) => console.error('MongoDB Connection Failed:', error));

const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: String,
  conversationId: String,
  username: String,
  time: String

})

const convoSchema = new mongoose.Schema({
  conversationId: String,
  username: String,
  messages: [messageSchema],
})

const Model = mongoose.model('Conversation', convoSchema);


let name = "";


app.post("/predict", (req, res) => {
  const { text } = req.body;

  const py = spawn("python", ["predict.py", text]);

  let result = "";
  py.stdout.on("data", (data) => {
    result += data.toString();
  });

  py.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  py.on("close", () => {
    res.json({ intent: result.trim() });
  });
});


app.post('/conversations', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { sender, message, timestamp, conversationId, username, time } = req.body;
    name = username;
    const newMessage = { sender, message, timestamp, username, time };
    const updatedConversation = await Model.findOneAndUpdate(
      { username },
      { $push: { messages: newMessage } },
      { upsert: true, new: true }
    );
    res.json(updatedConversation);
  }
  catch (error) {
    console.error('Error in Insertion:', error);
    res.status(500).json({ error: 'Failed to Insert Data!' });
  }
})


app.post('/api/gemini', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.username) return res.status(401).json({ error: 'Invalid token' });

    const { prompt, username } = req.body;
    const convo = await Model.findOne({ username });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    let memoryText = "";
    if (convo?.messages?.length > 0) {
      const recentMessages = convo.messages.slice(-6);
      memoryText = recentMessages
        .map(m => `${m.sender === 'user' ? "User" : "JARVIS"}: ${m.message}`)
        .join('\n');
    }

    const Superprompt = `
You are Jarvis, a friendly AI personal assistant powered by Gemini. 
Your role is to help the user with setting reminders, maintaining tasks, and being conversational.

--- Context Handling ---
- You will always be addressed as "Jarvis".
- You are helpful, polite, and concise, but also friendly in tone.
- You can maintain context from about 6 exchanges of conversation.

--- Reminders ---
- You can set reminders ONLY if the user provides a specific time/date or relative time (like "today", "tomorrow", "next Monday").
- Do not accept vague requests without a time reference (e.g., "remind me later").
- When confirming a reminder, rephrase clearly with the exact time/day.

--- Tasks ---
- Tasks are daily notes that trigger notifications at **9:00 AM every day**, starting from the day the task was created.
- When the user asks about their tasks, you should not directly list them. 
- Instead, you must tell the user to use one of these trigger keywords so the taskbar UI can be opened:

    ["what are my tasks",
     "show my tasks",
     "list tasks",
     "pending tasks",
     "tasks left",
     "to-do list",
     "what do i have to do",
     "task status",
     "view tasks",
     "open task list",
     "what's pending",
     "remind me my tasks",
     "open taskbar"]

--- Behavior Example ---
User: "Remind me to submit my project tomorrow evening."
Jarvis: "Got it! I'll remind you to submit your project tomorrow at 6:00 PM."

User: "Add finish assignment to my tasks."
Jarvis: "Done! I've added 'finish assignment' to your daily tasks. You'll get notified every day at 9 AM."

User: "Show my tasks."
Jarvis: "To view your tasks, please use one of the taskbar commands like 'open task list' or 'what are my tasks' so I can pull them up."

Remember: stay friendly, efficient, and task-focused. Also you dont need to add "Jarvis:" to your response the app will add it automatically so just respond to the message.

--Actual Memory--
${memoryText}
--user's prompt--
 ${prompt}
`;

    const response = await axios.post(url, {
      contents: [
        {
          parts: [{ text: Superprompt }]
        }
      ]
    });

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to respond.";
    res.json({ response: aiResponse });

    console.log('Response Received Successfully!', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch response from Gemini" });
  }
});

app.post("/notifications", async (req, res) => {
  try {
    const text = req.body.text;
    const context = req.body.context;
    const prompt = `
You are Jarvis, an AI assistant responsible for generating clean and friendly notification texts.

--- General Rules ---
- Notifications must be **short, clear, and natural**.
- Always be polite and motivational, but not too formal.
- Keep the tone like a helpful assistant reminding the user, not robotic.

--- Reminders ---
- A reminder notification must include the task and the time context if relevant.
- Do not add unnecessary fluff.
- Keep it under 12 words if possible.

Examples:
- "🔔 Hey there, Submit your project by 6:00 PM."
- "🔔 Jarvis here, Take your medicine now."
- "🔔 You asked me to remind you to Call mom tomorrow evening."

--- Daily Tasks ---
- Daily task notifications are triggered at 9:00 AM every day.
- These should encourage the user to check tasks or start their day productively.
- Use a friendly, motivating tone.

Examples:
- "🌞 Good morning! Here's your daily task list."
- "📋 Don’t forget your pending tasks today."
- "🚀 Time to check your to-do list and get started!"
- "✅ Stay on track! Review your tasks for today."

--- Behavior ---
- If generating for a reminder, use the reminder style.
- If generating for daily tasks, use the daily task style.
- Do not include explanations, just the raw notification text.
--Generate Notification for the prompt--
user-prompt: ${text} 
context: ${context}
`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    const response = await axios.post(url, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    });

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to respond.";
    res.json({ response: aiResponse });
  }

  catch (error) {
    console.error("Error:", error);
  }
})






app.get('/conversations/:username', async (req, res) => {
  const { username } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded || !decoded.username) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const userConvo = await Model.findOne({ username: username });
    console.log(username);
    if (!userConvo) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(userConvo);
    res.json(userConvo);
  } catch (error) {
    console.error("Error fetching user conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/convoss/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const deleteConvo = await Model.findOneAndDelete({ username });

    if (deleteConvo) {
      console.log("Chat deleted successfully!");
      res.status(200).json({ message: "Chat deleted successfully." });
    } else {
      console.log("No chat found to delete.");
      res.status(404).json({ message: "No chat found for this user." });
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const Schema = new mongoose.Schema({
  usermail: String,
  password: String,
  telegramToken: String,
  android: Boolean
});

const model = mongoose.model('login', Schema);
const saltRounds = 10;



app.post('/login', async (req, res) => {
  try {
    const { usermail, password, change, telegramToken, android } = req.body;
    name = usermail;
    if (change) {
      const hashedpass = await bcrypt.hash(password, saltRounds);
      const changeUserpassword = await model.findOneAndUpdate({ usermail }, { password: hashedpass });
      console.log('Password changed successfully');
    }
    else {
      const existingUser = await model.findOne({ usermail });

      if (existingUser) {
        const compare = await bcrypt.compare(password, existingUser.password);
        if (compare) {
          const token = jwt.sign({ username: existingUser }, JWT_SECRET, { expiresIn: "7d" });
          return res.send({ status: 'login', message: 'Login accepted', token, usermail });

        } else {
          return res.json({ status: 'error', message: 'Wrong credentials' });
        }
      } else {
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new model({ usermail, password: encryptedPassword, telegramToken: telegramToken, android: android });
        await newUser.save();
        return res.json({ status: 'ok', message: 'New user created' });
      }
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
});



const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // expires after 5 minutes
});

const otpmodel = mongoose.model('otp', otpSchema, 'otp');

app.post('/otp', async (req, res) => {
  const { usermail, otp } = req.body;
  const otpauth = await otpmodel({ email: usermail, otp: otp });
  otpauth.save();
  console.log("Email saved");




  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: usermail,
    subject: 'Your OTP from JARVIS',
    text: `Your OTP is: ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

const reminderSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  username: String,
  intent: String,
  datetime: Date,
  task: String,
});
const Reminder = mongoose.model("Reminder", reminderSchema);





app.post("/reminders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { username, datetime, intent, task } = req.body;

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
  message: String
})

const TaskModel = mongoose.model("Task", TaskSchema)







app.post("/tasks", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { username, datetime, intent, task, message } = req.body;

    if (!username) return res.status(400).send("Reminder name is required.");
    const updatedTask = await new TaskModel({
      username,
      datetime,
      intent,
      task,
      message
    });
    await updatedTask.save();



    console.log(" Task Added:", updatedTask);
    res.send("Task Added");
  } catch (error) {
    console.error(" Error Adding task:", error);
    res.status(500).send("Server Error");
  }
});

app.post("/removetasks", async (req, res) => {
  try {
    const response = await TaskModel.findOneAndDelete({ task: req.body.task });
    res.send("Task Deleted");
  }
  catch (error) {
    console.error("Error:", error);
  }
})


app.post("/fetchtasks", async (req, res) => {
  try {
    const user = req.body.user;
    const tasks = await TaskModel.find({ username: user });
    res.send({ tasks: tasks })
  }
  catch (error) {
    console.error("Error:", error);
  }

})



  const extractTask = (input) => {
    const doc = nlp(input)
    const filler = new Set(["dude", "bro", "hey", "man", "yo", "list", "task"])

    let nouns = doc.nouns().out('array')

    nouns = nouns.filter(n => !filler.has(n.toLowerCase()))

    const verbs = doc.verbs().out('array')

    if (verbs.some(v => ["add", "put", "schedule", "insert"].includes(v))) {
      return nouns[0] || null
    }

    return nouns[0] || null
  }

app.post("/parsetext", async (req, res) => {
  const text = req.body.text;
  const actualtask = extractTask(text);
  const parseddate = chrono.parseDate(text);
  if (!parseddate) {
    return res.json({ "message": "Could Extract Time" });
  }
  const results = chrono.parse(text);
  let task = text;
  if (results.length > 0) {
    results.forEach(r => {
      task = task.replace(r.text, "").trim();
    });
  }

  return res.json({ date: parseddate, task: actualtask })

})


const sendTelegramMessage = async (text, username) => {
  try {

    console.log("Telegram function works");
    const telegram_token = await model.findOne({ usermail: username });
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: telegram_token.telegramToken,
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
  const user = await model.findOne({ usermail: username });
  console.log(`⏰ Cron Job running at IST ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  try {
    const dueReminders = await Reminder.find({
      datetime: { $gte: now, $lte: new Date(now.getTime() + 59000) }
    });
    console.log(dueReminders);

    for (const rem of dueReminders) {
      const message = `${rem.task}`;
      if (user.android) {
        if (!Expo.isExpoPushToken(user.telegramToken)) {
          continue;
        }

        const messages = [{
          to: token,
          sound: "default",
          title: "🔔 Reminder",
          body: rem.message,
          data: { withSome: "data" },
        }];

        try {
          let chunks = expo.chunkPushNotifications(messages);
          let tickets = [];
          for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          }
        }
        catch (error) {
          console.error("Error:", error);
        }
      }
      else {
        await sendTelegramMessage(message, rem.username);
      }
      Reminder.findByIdAndDelete(rem._id)
        .then(() => console.log("🗑 Reminder deleted"))
        .catch((err) => console.error("❌ Error deleting reminder:", err));

    }

  } catch (error) {
    console.error("❌ Error Checking Reminders:", error);
  }

  try {
    const dueTasks = await TaskModel.find({
      datetime: { $gte: now, $lte: new Date(now.getTime() + 59000) }
    });
    for (const rem of dueTasks) {
      const message = `${rem.message}`;
      if (user.android) {
        if (!Expo.isExpoPushToken(user.telegramToken)) {
          continue;
        }

        const messages = [{
          to: token,
          sound: "default",
          title: "🔔 Reminder",
          body: rem.message,
          data: { withSome: "data" },
        }];

        try {
          let chunks = expo.chunkPushNotifications(messages);
          let tickets = [];
          for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          }
        }
        catch (error) {
          console.error("Error:", error);
        }
      }
      await sendTelegramMessage(message, rem.username);
      TaskModel.findByIdAndDelete(rem._id)
        .then(() => console.log("🗑 Task deleted"))
        .catch((err) => console.error("❌ Error deleting Task:", err));
    }
  }
  catch (error) {
    console.error("Error:", error);
  }
});

cron.schedule('0 9 * * *', async () => {
  console.log("🕘 Daily Task Reminder Cron Triggered!");

  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const today = new Date(istNow.toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    const upcomingTasks = await TaskModel.find({});

    console.log('✅ Cron is checking for tasks');

    if (upcomingTasks.length === 0) {
      console.log("📆 No upcoming tasks today.");
      return;
    }

    for (const task of upcomingTasks) {
      let message;
      if (task.datetime) {
        const dueDate = new Date(task.datetime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        });
        message = `"${task.message}" Due Date:${dueDate}`;
      } else {
        message = `"${task.message}"`;
      }
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


app.get('/teleid', async (req, res) => {
  TELEGRAM_CHAT_ID = req.data.teleid;
})



app.get('/username', async (req, res) => {
  res.send(name);
  console.log(name);

})



app.listen(PORT, () => {
  console.log('Server is Running Sucessfully!');
  console.log(`PORT:${PORT}`);
})
