const express = require("express");
const {accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup} = require("../controllers/chatController");
const protect = require("../middleware/authToken");
const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/creategroup', protect, createGroupChat);
router.put('/renamegroup', protect, renameGroup);
router.put('/addtogroup', protect, addToGroup);
router.put('/removefromgroup', protect, removeFromGroup);

module.exports = router;