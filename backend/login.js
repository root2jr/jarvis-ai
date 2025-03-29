import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'




dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
    .then(() => { console.log("MONODB is Connected Sucessfully!") })
    .catch(error => { console.error("Error connecting MONGODB:", error) })


const Schema = new mongoose.Schema({
    usermail: String,
    password: String
});

const model = mongoose.model('login', Schema);
const saltRounds = 10;

let name = ""

app.post('/login', async (req, res) => {
    try {
        const { usermail, password, change } = req.body;
        name = usermail;
        if(change){
            const hashedpass = await bcrypt.hash(password,saltRounds);
            const changeUserpassword = await model.findOneAndUpdate({ usermail },{ password: hashedpass});
            console.log('Password changed successfully');
        }
        else{
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
            await newUser.save();
            return res.json({ status: 'ok', message: 'New user created' });
        }

    }} catch (err) {
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
    console.log("Server is Running Sucessfully!");
    console.log("PORT:", PORT);
})