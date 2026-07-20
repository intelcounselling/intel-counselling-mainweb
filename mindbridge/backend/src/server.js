require('dotenv').config();
const http = require('http');
const app = require('./app');
const prisma = require('./prisma');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

async function startServer() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    server.listen(PORT, () => {
      logger.info(`🚀 Intel Counselling API running on http://localhost:${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

startServer();
