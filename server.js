require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { purgeExpiredAccounts } = require('./src/modules/auth/service/auth.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await purgeExpiredAccounts().catch((error) => {
    console.error('Initial account purge failed:', error.message);
  });

  setInterval(() => {
    purgeExpiredAccounts().catch((error) => {
      console.error('Scheduled account purge failed:', error.message);
    });
  }, 24 * 60 * 60 * 1000);
  
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();