const asyncHandler = require("express-async-handler");
const User = require("../Models/userModel");
const jwt = require("jsonwebtoken");

// middlewares
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // decode token id
      const decoded = jwt.verify(token, "anySecretKey");

      req.user = await User.findById(decoded.id).select("-password");
      next();

    } catch (error) {
      res.status(401);
      throw new Error("Token is not authorized")
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Token is empty")
  }

})

module.exports = protect;