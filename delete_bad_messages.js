const mongoose = require('mongoose');
const Message = require('./src/modules/messages/model/message.model');
const User = require('./src/modules/auth/model/user.model');

async function clean() {
  await mongoose.connect('mongodb://127.0.0.1:27017/asaan-taqreeb');
  
  // Find all messages
  const messages = await Message.find().lean();
  let deletedCount = 0;
  
  for (const msg of messages) {
    const sender = await User.findById(msg.senderId);
    const receiver = await User.findById(msg.receiverId);
    
    if (!sender || !receiver) {
      await Message.findByIdAndDelete(msg._id);
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} bad messages with invalid sender/receiver.`);
  process.exit();
}

clean().catch(console.error);
