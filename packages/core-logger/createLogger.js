import { createLogger, format, transports } from 'winston';
import stringify from 'safe-stable-stringify';

const {
  DEBUG = '',
  LOG_LEVEL = 'info',
  UNCHAINED_LOG_FORMAT = 'unchained',
} = process.env;

const debugStringContainsModule = (debugString, moduleName) => {
  const loggingMatched = debugString.split(',').reduce((accumulator, name) => {
    if (accumulator === false) return accumulator;
    const nameRegex = name
      .replace('-', '\\-?')
      .replace(':*', '\\:?*')
      .replace('*', '.*');
    const regExp = new RegExp(`^${nameRegex}$`, 'm');
    if (regExp.test(moduleName)) {
      if (name.slice(0, 1) === '-') {
        // explicitly disable
        return false;
      }
      return true;
    }
    return accumulator;
  }, undefined);
  return loggingMatched || false;
};

const myFormat = format.printf(
  ({ level, message, label, timestamp, stack, ...rest }) => {
    const otherPropsString = ''; // stringify(rest);
    return [
      `${timestamp} [${label}] ${level}:`,
      `${message}`,
      `${otherPropsString}`,
      stack ? `\n${stack}` : null,
    ]
      .filter(Boolean)
      .join(' ');
  }
);

const UnchainedLogFormats = {
  unchained: format.combine(format.colorize(), myFormat),
  json: format.combine(format.json()),
};

if (!UnchainedLogFormats[UNCHAINED_LOG_FORMAT.toLowerCase()]) {
  throw new Error(
    `UNCHAINED_LOG_FORMAT is invalid, use one of ${Object.keys(
      UnchainedLogFormats
    ).join(',')}`
  );
}

export { transports, format };

export default (moduleName, moreTransports = []) => {
  const loggingMatched = debugStringContainsModule(DEBUG, moduleName);
  return createLogger({
    format: format.combine(
      format.errors({ stack: true }),
      format.timestamp(),
      format.label({ label: moduleName })
    ),
    transports: [
      new transports.Console({
        format: UnchainedLogFormats[UNCHAINED_LOG_FORMAT],
        stderrLevels: ['error'],
        consoleWarnLevels: ['warn'],
        level: loggingMatched ? 'debug' : LOG_LEVEL,
      }),
      ...moreTransports,
    ],
  });
};
