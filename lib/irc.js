/* eslint no-console: 0 */
'use strict';

const irc = require('irc');

const server = process.env.IRC_SERVER;
const user = process.env.IRC_USER;
const channel = process.env.IRC_CHANNEL;

const client = module.exports.client = new irc.Client(server, user, {
  autoConnect: false,
  autoRejoin: true,
  channels: [channel],
  showErrors: true,
});

client.connect(5, () => {
  if (process.env.NODE_ENV !== 'testing') {
    console.log('[IRC] connected');
  }
});

if (process.env.NODE_ENV !== 'testing') {
  client.addListener('registered', (message) => {
    console.log('[IRC] registered', message.args[1]);
  });
}

client.addListener('error', (error) => {
  console.error('[IRC] error', error.mesage);
  console.error(error.stack);
  process.exit(1);
});

module.exports.notify = (b, callback) => {
  const msg = `Jenkins build node-test-pull-request#${b.id} for nodejs/node#${b.pr_id} started`;
  client.notice(channel, msg);
  callback(null);
};
