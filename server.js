const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const Chat = require("./Models/chatModel");
const Message = require("./Models/messageModel");

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

var onlineUsers = [];

io.on("connection", (socket) => {
  // console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    // console.log(userData._id);
    socket.join(userData._id);
    socket.emit("connected", userData._id);

    if (!onlineUsers.includes(userData._id)) {
      onlineUsers.push(userData._id)
      io.sockets.emit("online users", onlineUsers);
    }
  })

  socket.on("join chat", (userId, chat) => {  
    socket.join(chat._id);
    chat?.users?.forEach((user) => {
      if (user._id == userId) return;

      socket.in(user._id).emit("other seen", chat?._id);
      
    })
    // console.log(`User joined Room : ${room}`);
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
  
  socket.on("seen", async (userId, chat) => {
    chat?.users?.forEach((user) => {
      if (user._id == userId) return;

      socket.in(user._id).emit("other seen", chat?._id);
      
    })

    try {

      await Chat.findByIdAndUpdate(
        chat?._id,
        {
          $pull: {"notification.$[].users": userId}
        },
      )
      
      await Message.updateOne(
        { chat: chat._id, seen: false },
        { $set: { seen: true } }
      )
     
    } catch (error) {
      console.log(error);
    }
  })


  socket.off("setup", () => {
    console.log("User disconnected");
    socket.leave(userData._id);
  })

  socket.on("disconnecting", (reason) => {
    for (const room of socket.rooms) {
      if (room !== socket.id && onlineUsers.includes(room)) {
        onlineUsers.splice(onlineUsers.indexOf(room), 1);
        io.sockets.emit("online users", onlineUsers);
      }
    }
  })

})