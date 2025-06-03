import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;


mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((error) => console.error('MongoDB Connection Failed:', error));

const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: String,
  conversationId: String,
  username: String


})

const convoSchema = new mongoose.Schema({
  conversationId: String,
  username: String,
  messages: [messageSchema],
})

const Model = mongoose.model('Conversation', convoSchema);


let name = "";

app.post('/conversations', async (req, res) => {
  try {
   
    const { sender, message, timestamp, conversationId, username } = req.body;
    name = username;
    const newMessage = { sender, message, timestamp, username };
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
    const { prompt, username } = req.body;
    const convo = await Model.findOne({ username });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    let memoryText = "";
    if (convo && convo.messages.length > 0) {
      const recentMessages = convo.messages.slice(-6);
      memoryText = recentMessages
        .map(m => `${m.sender === 'user' ? "User" : "JARVIS"}: ${m.message}`)
        .join('\n');
    }

    const finalPrompt = `your name is JARVIS! only tell when asked by the user. Always respond like a nicest friend. Be supportive and behave nicely to the user. You are JARVIS and powered by gemini. Always say this when you are asked for your creator.\njust remember it and don't send it to the user unless he asks for it\n${memoryText}\nUser: ${prompt}\nJARVIS:`;

    const cleanPrompt = finalPrompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    const response = await axios.post(url, {
      prompt: {
        content: [
          { text: cleanPrompt }
        ]
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });

    console.log('Response Received Successfully!', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch response from Gemini" });
  }
});




app.get('/conversations/:username', async (req, res) => {
  const { username } = req.params;

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
    password: String
});

const model = mongoose.model('login', Schema);
const saltRounds = 10;



app.post('/login', async (req, res) => {
    try {
        const { usermail, password, change } = req.body;
        name = usermail;
        if (change) {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.username) {
                return res.status(401).json({ error: 'Invalid token' });
            }
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
                const newUser = new model({ usermail, password: encryptedPassword });
                const token = jwt.sign({username: newUser}, JWT_SECRET,{expiresIn:"7d"});
                await newUser.save();
                return res.json({ status: 'ok', message: 'New user created', token: token });
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




app.get('/username', async (req, res) => {
    res.send(name);
    console.log(name);

})



app.listen(PORT, () => {
  console.log('Server is Running Sucessfully!');
  console.log(`PORT:${PORT}`);
})
