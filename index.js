/* eslint no-console: 0 */
'use strict';

const jenkins = require('./lib/jenkins');
const schedule = require('node-schedule');
const redis = require('./lib/redis');
const irc = require('./lib/irc');

schedule.scheduleJob('* * * * *', () => {
  console.log('[CRON] running');

  jenkins.getBuilds({ limit: 5 }, (b, next) => {
    const key = `build:${b.id}`;

    redis.exists(key, (existsErr, exists) => {
      if (existsErr) { return next(existsErr); }
      if (exists === 1) { return next(); }

      console.log('[CRON]', key, 'NEW');
      redis.rpush('builds', b.id);

      redis.hmset(key, b, setErr => {
        if (setErr) { return next(setErr); }
        irc.notify(b, next);
      });
    });
  }, jenkinsErr => {
    if (jenkinsErr) { throw jenkinsErr; }

    console.log('[CRON] done');
  });
});

process.on('SIGINT', process.exit.bind(process, 0));
