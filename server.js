const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

const PORT = process.env.PORT || 5000;

// MongoDB Connection
const URI = "mongodb+srv://Thamizhanban:Thamizh123@cluster0.yiog4.mongodb.net/chat-app?retryWrites=true&w=majority";

mongoose.connect(URI).then((res) => console.log("mongoDB is connected")).catch((err) => console.log(err))

// cors
app.use(cors());

// Middleware
app.use(express.json());

// api
app.get("/", (req, res) => {
  res.send("API is running")
})
// routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// listen
app.listen(PORT,()=>{console.log(`server is running at port-${PORT}`)})