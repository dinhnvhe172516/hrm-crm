const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./sockets/notification.socket');
const logger = require('./shared/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect databases
    await connectDB();
    require('./shared/models');
    await connectRedis();

    // Tự động kiểm tra và seed dữ liệu mẫu ban đầu nếu chưa có
    try {
      const User = require('./shared/models/User.model');
      const sampleCount = await User.countDocuments({
        email: { $in: ['admin@nexus-corp.com', 'linh.nguyen@nexus-corp.com', 'minh.tran@nexus-corp.com', 'hoa.pham@nexus-corp.com'] },
      });
      if (sampleCount < 4) {
        logger.info(`📦 Cơ sở dữ liệu chưa đủ 4 tài khoản nhân sự mẫu (hiện có: ${sampleCount}/4). Đang tự động seed...`);
        const { seedRbac } = require('./scripts/seedRbac');
        await seedRbac(false);
      }
    } catch (seedErr) {
      logger.warn(`⚠️ Auto-seed check: ${seedErr.message}`);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    // Init Socket.io
    initSocket(server);

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectRedis } = require('./config/redis');
        await disconnectRedis();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
