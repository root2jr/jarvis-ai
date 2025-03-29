import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET; 

mongoose.connect(MONGO_URI)
.then(() =>{console.log("MONODB is Connected Sucessfully!")})
.catch(error => {console.error("Error connecting MONGODB:",error)})


const Schema = new mongoose.Schema({
    usermail: String,
    password: String
});

const model = mongoose.model('login',Schema);
const saltRounds = 10;

let name = ""

app.post('/login', async (req, res) => {
    try {
        const { usermail, password } = req.body;
        name = usermail;
        const existingUser = await model.findOne({ usermail });

        if (existingUser) {
            const compare = await bcrypt.compare(password,existingUser.password);
            if (compare) {
                const token = jwt.sign({username:existingUser},JWT_SECRET,{expiresIn:"1d"});
                return res.json({ status: 'login', message: 'Login accepted',token });
                
            } else {
                return res.json({ status: 'error', message: 'Wrong credentials' });
            }
        } else {
            const encryptedPassword = await bcrypt.hash(password,saltRounds);
            const newUser = new model({ usermail, password: encryptedPassword });
            await newUser.save();
            return res.json({ status: 'ok', message: 'New user created' });
        }

    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});


app.get('/username', async (req,res) =>{
    res.send(name);
    console.log(name);
    
})

app.listen(PORT, () =>{
    console.log("Server is Running Sucessfully!");
    console.log("PORT:",PORT);
})