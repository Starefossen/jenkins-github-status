/* eslint no-console: 0 */
'use strict';

const schedule = require('node-schedule');
const jobs = require('./lib/jobs');

schedule.scheduleJob('* * * * *', jobs.newJenkinsBuilds);

process.on('SIGINT', process.exit.bind(process, 0));
