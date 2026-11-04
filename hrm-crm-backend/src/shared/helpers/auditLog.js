'use strict';

const logger = require('../utils/logger');

/**
 * Ghi một bản ghi audit log vào collection MongoDB.
 * Không throw lỗi — lỗi ghi log không được làm gián đoạn flow chính.
 *
 * @param {import('mongoose').Model} Model - Mongoose model cần ghi (vd: LoginHistory)
 * @param {object} data - Data phù hợp với schema của Model
 */
const writeAuditLog = async (Model, data) => {
  try {
    await Model.create(data);
  } catch (err) {
    logger.error(`[AuditLog] Failed to write to ${Model.modelName}:`, err.message);
  }
};

module.exports = { writeAuditLog };
