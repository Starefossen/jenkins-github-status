/* eslint no-console: 0 */
'use strict';

const jenkins = require('./jenkins');
const redis = require('./redis');
const irc = require('./irc');

module.exports.newJenkinsBuilds = function newJenkinsBuilds() {
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
};
