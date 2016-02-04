/* eslint no-console: 0 */
'use strict';

const jenkins = require('./jenkins');
const redis = require('./redis');
const irc = require('./irc');

module.exports.log = function jobLog(name, message) {
  if (process.env.NODE_ENV !== 'testing') {
    console.log(`[${name}]`, message);
  }
};

module.exports.newJenkinsBuilds = function newJenkinsBuilds(done) {
  module.exports.log('new-builds', 'running');

  jenkins.getBuilds({ limit: 5 }, (b, next) => {
    const key = `build:${b.id}`;

    redis.exists(key, (existsErr, exists) => {
      if (existsErr) { return next(existsErr); }
      if (exists === 1) { return next(); }

      module.exports.log('new-builds', `${key} NEW`);
      redis.rpush('builds', key);

      redis.hmset(key, b, setErr => {
        if (setErr) { return next(setErr); }
        irc.notify(b, next);
      });
    });
  }, jenkinsErr => {
    if (typeof done === 'function') {
      return done(jenkinsErr);
    }

    if (jenkinsErr) { throw jenkinsErr; }

    module.exports.log('new-builds', 'done');
  });
};
