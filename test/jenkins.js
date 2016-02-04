/* eslint func-names: 0, prefer-arrow-callback: 0 */
'use strict';

const assert = require('assert');
const jenkins = require('../lib/jenkins');

// const gh_org = process.env.JENKINS_GH_ORG;
// const gh_repo = process.env.JENKINS_GH_REPO;
// const gh_pr = parseInt(process.env.JENKINS_GH_PR, 10);

describe('jenkins', function () {
  describe('destructBuildParams()', function () {
    it('returns destructed build parameters', function () {
      const build = {
        actions: [{
          parameters: [{
            name: 'TARGET_GITHUB_ORG',
            value: 'nodejs',
          }, {
            name: 'TARGET_REPO_NAME',
            value: 'node',
          }, {
            name: 'PR_ID',
            value: '4215',
          }, {
            name: 'POST_STATUS_TO_PR',
            value: true,
          }, {
            name: 'REBASE_ONTO',
            value: 'master',
          }],
        }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
        building: false,
        duration: 1504452,
        id: '969',
        timestamp: 1449695224345,
      };

      jenkins.destructBuildParams(build);

      assert.equal(typeof build.actions, 'undefined');
      assert.equal(build.org, 'nodejs');
      assert.equal(build.repo, 'node');
      assert.equal(build.pr_id, '4215');
      assert.equal(build.post_status, true);
    });
  });

  describe('getBuildsUrl()', function () {
    it('returns jenkins builds api url', function () {
      assert.equal(jenkins.getBuildsUrl(0, 10), [
        'https://ci.nodejs.org/job/node-test-pull-request/api/json',
        '?depth=2&tree=builds[duration,timestamp,id,building,',
        'actions[parameters[name,value]]]{0,10}',
      ].join(''));
    });
  });

  describe('getBuilds()', function () {
    it('loops one time', function (done) {
      this.timeout(10000);

      let count = 0;
      const limit = 10;

      jenkins.getBuilds({ limit }, (build, next) => {
        count++;
        next(null);
      }, err => {
        assert.ifError(err);
        assert.equal(count, limit);
        done();
      });
    });

    it('loops multiple times', function (done) {
      this.timeout(10000);

      let count = 0;
      const limit = 10;
      const loops = 2;

      jenkins.getBuilds({ limit }, (build, next) => {
        next(null, count++ < limit * (loops - 1) ? true : undefined);
      }, err => {
        assert.ifError(err);
        assert.equal(count, limit * loops);
        done();
      });
    });
  });

  describe('getBuild()', function () {
    it('returns build for build id', function (done) {
      this.timeout(5000);

      jenkins.getBuild(1519, (err, build) => {
        assert.ifError(err);

        assert.equal(build.building, false);
        assert.equal(build.displayName, '#1519');
        assert.equal(build.result, 'SUCCESS');
        assert.equal(typeof build.subBuilds, 'object');
        assert.equal(build.post_status, true);

        done();
      });
    });
  });
});
