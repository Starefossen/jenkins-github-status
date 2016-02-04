/* eslint func-names: 0, prefer-arrow-callback: 0 */
'use strict';

const assert = require('assert');
const jobs = require('../lib/jobs');

const redis = require('../lib/redis');
const irc = require('../lib/irc');
const jsonist = require('jsonist');

const jsonistGet = jsonist.get;
const ircNotify = irc.notify;

describe('jobs', function () {
  beforeEach(function (done) {
    redis.flushall(done);
  });

  beforeEach(function () {
    jsonist.get = () => { throw new Error('jsonist.get is not implemented'); };
    irc.notify = (b, cb) => { process.nextTick(cb.bind(null, null)); };
  });

  after(function () {
    jsonist.get = jsonistGet;
    irc.notify = ircNotify;
  });

  describe('newJenkinsBuilds', function () {
    it('stores each build in redis', function (done) {
      jsonist.get = (url, opts, cb) => {
        cb(null, JSON.parse(JSON.stringify(require('./assets/builds.json'))));
      };

      jobs.newJenkinsBuilds(jenkinsErr => {
        assert.ifError(jenkinsErr);

        const keys = [
          'build:1547',
          'build:1548',
          'build:1549',
          'build:1550',
          'build:1551',
        ];

        redis.multi({ pipeline: false });

        for (const key of keys) {
          redis.hget(key, 'id');
        }

        redis.exec(function (redisErr, result) {
          assert.ifError(redisErr);

          assert.deepEqual(result, [
            [null, '1547'],
            [null, '1548'],
            [null, '1549'],
            [null, '1550'],
            [null, '1551'],
          ]);

          done();
        });
      });
    });

    it('stores builds in on going build queue', function (done) {
      jsonist.get = (url, opts, cb) => {
        cb(null, JSON.parse(JSON.stringify(require('./assets/builds.json'))));
      };

      jobs.newJenkinsBuilds(jenkinsErr => {
        assert.ifError(jenkinsErr);
        redis.lrange('builds', 0, -1, (redisErr, builds) => {
          assert.ifError(redisErr);
          assert.deepEqual(builds, [
            'build:1551',
            'build:1550',
            'build:1549',
            'build:1548',
            'build:1547',
          ]);
          done();
        });
      });
    });

    it('only stores new builds in on going build queue', function (done) {
      redis.hmset('build:1547', { id: 1547 });
      redis.hmset('build:1549', { id: 1549 });

      jsonist.get = (url, opts, cb) => {
        cb(null, JSON.parse(JSON.stringify(require('./assets/builds.json'))));
      };

      jobs.newJenkinsBuilds(jenkinsErr => {
        assert.ifError(jenkinsErr);
        redis.lrange('builds', 0, -1, (redisErr, builds) => {
          assert.ifError(redisErr);
          assert.deepEqual(builds, ['build:1551', 'build:1550', 'build:1548']);
          done();
        });
      });
    });
  });
});
