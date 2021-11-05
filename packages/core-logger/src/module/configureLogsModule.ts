import { LogsModule } from 'unchained-core-types/logs';
import { ModuleInput } from 'unchained-core-types/common';
import { generateDbMutations } from 'meteor/unchained:utils';
import { LogsCollection } from '../db/LogsCollection';
import { LogsSchema } from '../db/LogsSchema';
import { log } from '../logger/log';

export const configureLogsModule = async ({
  db,
}: ModuleInput): Promise<LogsModule> => {
  const Logs = await LogsCollection(db);

  return {
    log: (message, options) => log(Logs, message, options),
    findLogs: async ({
      limit,
      offset,
      sort = {
        created: -1,
      },
    }) => {
      const logs = Logs.find(
        {},
        {
          skip: offset,
          limit,
          sort,
        }
      );

      return logs.toArray();
    },

    count: async () => {
      const count = await Logs.countDocuments();
      return count;
    },

    ...generateDbMutations(Logs, LogsSchema),
  };
};
