import Transport from 'winston-transport';
import { Meteor } from 'meteor/meteor';

export class LocalTransport extends Transport {
  Logs

  constructor(Logs) {
    this.Logs = Logs
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // eslint-disable-next-line
    const { level: formattedLevel, message, ...meta } = info;

    const level = info[Symbol.for('level')];
    Meteor.defer(() => {
      try {
        Logs.insert({
          created: new Date(),
          level,
          message,
          meta,
        });
      } catch (e) {
        console.trace(e); // eslint-disable-line
      }
    });
    callback();
  }
}
