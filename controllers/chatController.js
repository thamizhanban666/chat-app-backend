const asyncHandler = require("express-async-handler");
const Chat = require("../Models/chatModel");
const User = require("../Models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("userId had not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } }
    ]
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  })

  if (isChat.length > 0) {
    res.send(isChat[0])
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users:[req.user._id,userId],
    }

    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id })
        .populate("users", "-password");
      res.status(200).send(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
  
})

const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users","-password")
      .populate("groupAdmin","-password")
      .populate("latestMessage")
      .populate("notification")
      .sort({ updatedAt: "desc" })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
    })
  } catch (error) {
    res.status(400);
    throw new Error(error.message)
  }
})

// To create group chat
const createGroupChat = asyncHandler(async (req, res) => {

  // if any of the fields are empty
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  // stringfy to parse the user
  var users = JSON.parse(req.body.users);

  // if less than 2 users
  if (users.length < 2) {
    return res.status(400).send("Add atleast 2 users");
  }

  // also add the user who created the group
  users.push(req.user);

  try {
    // create the group chat
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user
    })

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    
    res.status(200).json(fullGroupChat);

  } catch (error) {
    res.status(200);
    throw new Error(error.message);
  }

})

// To rename group
const renameGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName }, { new: true })
      .populate("users", "-passworrd")
      .populate("groupAdmin", "-password");

    res.json(updatedChat);

  } catch (error) {
    res.status(400);
    throw new Error("Chat not found");
  }
})

// To add an user to group
const addToGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(chatId, { $push: { users: userId } }, { new: true })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")

    res.json(added);

  } catch (error) {
    res.status(400);
    throw new Error("Chat not found");
  }
  
})

// To remove an user from group
const removeFromGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(chatId, { $pull: { users: userId } }, { new: true })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")

    res.json(removed);

  } catch (error) {
    res.status(400);
    throw new Error("Chat not found");
  }
  
})

module.exports = {accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup}