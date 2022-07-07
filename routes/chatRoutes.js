const express = require("express");
const accessChat = require("../controllers/chatController");
const protect = require("../middleware/authToken");
const router = express.Router();

router.post('/', protect, accessChat);
// router.get('/', protect, fetchChat);
// router.post('/creategroup', protect, createGroupChat);
// router.put('/renamegroup', protect, renameGroup);
// router.put('/removefromgroup', protect, removeFromGroup);
// router.put('/addtogroup', protect, addToGroup);

module.exports = router;