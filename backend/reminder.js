import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import mongoose, { Mongoose } from 'mongoose';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;


mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB is Connected Successfully"))
.catch((error) => console.error("MongoDB Connection Failed:", error));


app.get("/" ,(req, res) => {
    res.send("🧠 JARVIS Reminder Backend is Live!");
})

const reminderSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    datetime: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  
const reminder = mongoose.model("Reminder", reminderSchema);

app.post("/reminders", async (req, res) => {
    try{
        const {title, datetime, email} = req.body;
        const newReminder = new reminder({title, datetime, email});
        await newReminder.save();
        console.log("New Reminder Added:", newReminder);
        res.send("Reminder Added Successfully!");
    }
    catch(error){
        console.error("Error in Adding Reminder:", error);
    }
});
app.listen(PORT, () =>{
    console.log(`Server is running on PORT: ${PORT}`);
})