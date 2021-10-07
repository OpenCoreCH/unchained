import { LogsModule } from 'unchained-core-types';
import { LogsCollection } from './db/LogsCollection';
import { createLogger, format, transports } from './logger/createLogger';
import { configureLogsModule } from './module/configureLogsModule';

const configureLogs = async ({ db }: { db: any }): Promise<LogsModule> => {
  const Logs = await LogsCollection(db);
  const module = configureLogsModule(Logs);

  return module;
};

export { configureLogs, createLogger, format, transports };
