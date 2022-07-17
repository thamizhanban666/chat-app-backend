const asyncHandler = require("express-async-handler");
const User = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// signUp 
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  // check whether the email is already exist
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("This email is already registered");
  }

  // bcrypting the password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(req.body.password, salt);
  req.body.password = hash;

  // create a new user
  const user = await User.create(req.body)
  if (user) {
    res.status(201).json({...user._doc,token:jwt.sign({ _id: user._doc._id }, "anySecretKey")});
  } else {
    res.status(400);
    throw new Error("Failed to create the user");
  }

}) 

// Login authorization
const authUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
  // check whether the email is already exists
  const user = await User.findOne({ email });
  if (user) {
    //compare the passwords
    let compare = bcrypt.compareSync(req.body.password, user.password);
    if (compare) {
      res.status(201).json({...user._doc,token:jwt.sign({ _id: user._doc._id }, "anySecretKey")});
    } else {
      res.status(401).json({error:"Password is wrong"});
    }
  } else {
    res.status(404).json({error:"Enter the registered e-mail"});
  }
    
})

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search ? {
    $or: [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ]
  } : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } });
  res.status(201).send(users);

})

module.exports = { registerUser, authUser, allUsers };