'use strict';

const UAParser = require('ua-parser-js');
const geoip    = require('geoip-lite');

/**
 * Parse thông tin thiết bị, trình duyệt, OS và vị trí địa lý từ request.
 *
 * @param {import('express').Request} req
 * @returns {{
 *   ipAddress:  string,
 *   userAgent:  string,
 *   location:   string,
 *   deviceName: string,
 *   deviceType: 'desktop'|'mobile'|'tablet'|'unknown',
 *   deviceInfo: { browser: string, os: string, deviceType: string }
 * }}
 */
const parseDeviceInfo = (req) => {
  const ua        = new UAParser(req.headers['user-agent'] || '');
  const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
  const geo       = geoip.lookup(ipAddress);
  const location  = geo
    ? `${geo.city || ''}, ${geo.country || ''}`.trim().replace(/^,\s*/, '')
    : 'Unknown';

  const browser    = `${ua.getBrowser().name || ''} ${ua.getBrowser().version || ''}`.trim();
  const os         = `${ua.getOS().name || ''} ${ua.getOS().version || ''}`.trim();
  const deviceType = ua.getDevice().type || 'desktop';

  return {
    ipAddress,
    userAgent:  req.headers['user-agent'] || '',
    location,
    deviceName: `${ua.getBrowser().name || 'Browser'} on ${ua.getOS().name || 'OS'}`,
    deviceType,
    deviceInfo: { browser, os, deviceType },
  };
};

module.exports = { parseDeviceInfo };
