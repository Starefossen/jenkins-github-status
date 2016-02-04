/* eslint no-param-reassign: 0 */
'use strict';

const jsonist = require('jsonist');
const each = require('async-each-map');

const jenkinsUrl = process.env.JENKINS_URL;
const jenkinsJob = process.env.JENKINS_JOB || 'node-test-pull-request';

module.exports.destructBuildParams = (build) => {
  build.org = build.actions[0].parameters[0].value;
  build.repo = build.actions[0].parameters[1].value;
  build.pr_id = parseInt(build.actions[0].parameters[2].value, 10);
  build.post_status = build.actions[0].parameters[3].value;

  delete build.actions;
};

module.exports.getBuildsUrl = function jenkinsGetBuildsUrl(count, limit) {
  return `${jenkinsUrl}/job/${jenkinsJob}/api/json?depth=2&tree=builds[${[
    'duration', 'timestamp', 'id', 'building', 'actions[parameters[name,value]]',
  ].join(',')}]{${count},${count + limit}}`;
};

module.exports.getBuilds = function jenkinsGetBuilds(opts, callback, done) {
  let count = opts.count || 0;
  const limit = opts.limit || 10;

  const url = module.exports.getBuildsUrl(count, limit);
  const urlOpts = {
    auth: `${process.env.JENKINS_USER}:${process.env.JENKINS_AUTH}`,
  };

  jsonist.get(url, urlOpts, (jsonError, jobs) => {
    if (jsonError) { done(jsonError); }

    jobs.builds.forEach(module.exports.destructBuildParams);

    each(jobs.builds, callback, (eachErr, newJobs) => {
      if (eachErr) { done(eachErr); }

      if (newJobs.length === 0) {
        return done(null);
      }

      count = count + limit;

      module.exports.getBuilds(opts, callback, done);
    });
  });
};

module.exports.getBuild = function jenkinsGetBuild(buildId, cb) {
  const url = `${jenkinsUrl}/job/${jenkinsJob}/${buildId}/api/json`;
  const urlOpts = {
    auth: `${process.env.JENKINS_USER}:${process.env.JENKINS_AUTH}`,
  };

  jsonist.get(url, urlOpts, (err, build) => {
    if (err) { return cb(err); }

    module.exports.destructBuildParams(build);

    return cb(null, build);
  });
};
