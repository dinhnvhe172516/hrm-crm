'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

const isSmtpConfigured = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(user && pass && user !== 'your_email@gmail.com' && pass !== 'your_app_password');
};

const getTransporter = () => {
  if (!transporter && isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const emailService = {
  /**
   * Gửi email chung
   */
  sendMail: async ({ to, subject, html, text }) => {
    const from = process.env.EMAIL_FROM || 'NEXUS CORP <noreply@nexus-corp.com>';

    if (!isSmtpConfigured()) {
      logger.info('----------------------------------------------------------------------');
      logger.info(`📧 [DEV EMAIL SIMULATOR] Gửi email giả lập tới: ${to}`);
      logger.info(`👉 Tiêu đề: ${subject}`);
      if (text) logger.info(`👉 Nội dung: ${text}`);
      logger.info('----------------------------------------------------------------------');
      return { success: true, simulated: true };
    }

    try {
      const transport = getTransporter();
      const info = await transport.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      logger.info(`✅ Email sent successfully to ${to} [MessageId: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, error.message);
      // Không để lỗi SMTP làm crash luồng nghiệp vụ trong môi trường thử nghiệm
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️ SMTP send failed, logged to console for development testing.');
        return { success: false, error: error.message, simulated: true };
      }
      throw error;
    }
  },

  /**
   * Gửi Email chứa Mã OTP và Link đặt lại mật khẩu
   */
  sendPasswordResetOtpEmail: async ({ to, fullName, otp, resetUrl, expiresInMinutes = 15 }) => {
    const subject = `[NEXUS CORP] Mã OTP đặt lại mật khẩu: ${otp}`;

    const text = `Xin chào ${fullName || 'Nhân viên'},\n\nBạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản nội bộ.\nMã OTP của bạn là: ${otp} (Hiệu lực: ${expiresInMinutes} phút).\nHoặc bạn có thể truy cập liên kết: ${resetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; font-family: monospace; }
        .btn { display: inline-block; padding: 13px 28px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 10px; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>NEXUS CORPORATION</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Hệ thống Quản trị Nội bộ HRM &amp; CRM</p>
        </div>
        <div class="body">
          <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${fullName || 'Quý nhân sự'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
            Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản: <strong style="color: #0f172a;">${to}</strong>.
            Vui lòng sử dụng mã xác thực OTP 6 số dưới đây để hoàn tất:
          </p>
          
          <div class="otp-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px;">Mã OTP xác thực</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #ef4444; margin-top: 6px; font-weight: 500;">Hiệu lực trong ${expiresInMinutes} phút</div>
          </div>

          <p style="font-size: 13px; color: #64748b; text-align: center;">Hoặc nhấp vào nút bên dưới để đổi mật khẩu trực tiếp:</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetUrl}" class="btn" target="_blank">Đặt Lại Mật Khẩu Ngay</a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            ⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc thông báo ngay cho ban Quản trị IT.
          </p>
        </div>
        <div class="footer">
          © 2026 NEXUS Corp. Security Team · All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    // Luôn in ra console máy chủ để lập trình viên và kiểm thử viên có thể copy ngay
    console.log('\n======================================================================');
    console.log('🔑 [PASSWORD RESET EMAIL SENT]');
    console.log(`👉 Người nhận (To): ${to} (${fullName})`);
    console.log(`👉 MÃ OTP 6 CHỮ SỐ:  >>> ${otp} <<< (Hạn 15 phút)`);
    console.log(`👉 Link đặt lại MK:  ${resetUrl}`);
    console.log('======================================================================\n');

    return emailService.sendMail({
      to,
      subject,
      text,
      html,
    });
  },
};

module.exports = emailService;

