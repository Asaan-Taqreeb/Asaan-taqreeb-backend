const mongoose = require('mongoose');
const Message = require('./src/modules/messages/model/message.model');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/asaan-taqreeb');
  const messages = await Message.find().sort({createdAt: -1}).limit(2).lean();
  console.log(JSON.stringify(messages, null, 2));
  process.exit();
}
check();
