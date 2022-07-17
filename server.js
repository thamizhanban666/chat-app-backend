const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

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
app.use('/api/message', messageRoutes);

// listen
const server = app.listen(PORT, () => { console.log(`server is running at port-${PORT}`) });

// socket.io
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {origin:"*"}
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  })

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User joined Room : ${room}`);
  })

  socket.on("typing", (room) => socket.to(room).emit("typing"));
  socket.on("stop typing", (room) => socket.to(room).emit("stop typing"));
  
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    chat.users.forEach((user) => {
      if (!user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
      
    })
  })

  socket.off("setup", () => {
    console.log("User disconnected");
    socket.leave(userData._id)
  })

})