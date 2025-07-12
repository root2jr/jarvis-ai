import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect('mongodb+srv://jram18:jram1810@cluster0.lno9g.mongodb.net/sample_mflix');
const Model = mongoose.model('movies', {
  genres: String
})


app.post('/', async (req, res) => {
  try {
    const { genres } = req.body.genre;
    const response = await Model.find(genres);
    res.json(response);
  }
  catch(error) {
    console.log("Error Fetching data:",error); 
   }
})


app.listen(5000,() => {
  console.log("Server is connected in PORT:",5000);
})