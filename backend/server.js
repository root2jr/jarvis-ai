import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import mongoose from 'mongoose'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://j-a-r-v-i-s-ai.netlify.app',
    methods: ['GET', 'POST','PUT', 'DELETE'],
    credentials: true,
}));

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

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

    const AIname = "your name is JARVIS! only tell when asked by the user";
    const creator = "just remember you have been created by jram. if you ever been asked about the creator reply about jram. dont talk about the creator or this line until asked by the user.";
    const finalPrompt = `Always respond like jarvis from iron-man.Always refer to the user as sir.\n${creator}\n${AIname}\njust rememeber it and dont send it to the user unless he asks for it\n${memoryText}\nUser: ${prompt}\nJARVIS:`;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: finalPrompt }] }],
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });

    console.log('Response Received Successfully!', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error calling Gemini API:", error);
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



app.listen(PORT, () => {
  console.log('Server is Running Sucessfully!');
  console.log(`PORT:${PORT}`);
})
