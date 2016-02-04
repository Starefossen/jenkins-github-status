'use strict';

const Redis = require('ioredis');
const redis = new Redis(6379, 'redis', {
  keyPrefix: process.env.REDIS_KEY_PREFIX || '',
});

module.exports = redis;
