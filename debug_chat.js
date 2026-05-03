const mongoose = require('mongoose');
const Message = require('./src/modules/messages/model/message.model');

async function debug() {
  await mongoose.connect('mongodb://127.0.0.1:27017/asaan-taqreeb');
  const msgs = await Message.find().sort({createdAt: -1}).limit(5).lean();
  console.log("Recent 5 Messages:");
  console.log(JSON.stringify(msgs, null, 2));
  process.exit();
}
debug().catch(console.error);
