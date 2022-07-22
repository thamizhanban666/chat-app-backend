const asyncHandler = require("express-async-handler");
const Chat = require("../Models/chatModel");
const Message = require("../Models/messageModel");
const User = require("../Models/userModel");

const sendMessage = asyncHandler(async (req, res) => {
  
  const { content, chatId, users } = req.body;
  const sender = req.user._id;

  if (!content || !chatId || !sender) {
    console.log("Invalid request");
    return res.sendStatus(400);
  }
  
  var newMessage = { sender, content, chat: chatId };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    })

    await Chat.findByIdAndUpdate(
      req.body.chatId,
      {
        latestMessage: message,
        $push: { notification: { message: { sender: message.sender, content: message.content, _id: message._id }, users: users } }
      },
      { new: true }
    )

    res.json(message);

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

}) 

const allMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const chatId = req.params.chatId;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    
    const exist = await Chat.findOne({_id:chatId, notification: {$exists:true}})
    if (exist) {
      await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: {"notification.$[].users": userId}
        },
      )

      await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { notification: { users: { $size: 0 } } }
        },
        {multi: true}
      )
    }

    const otherUser = messages[0].chat.users[0].toString() == userId?  messages[0].chat.users[1].toString() : messages[0].chat.users[0].toString()

    // console.log(messages[0].chat.users[0]+" "+userId, otherUser)

    await Message.updateMany(
      { chat: chatId, sender: otherUser, seen: false },
      { $set: { seen: true } }
    )
      
    res.json(messages);

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
})

module.exports = { sendMessage, allMessages };