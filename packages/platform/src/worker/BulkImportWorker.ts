import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { BaseAdapter } from 'meteor/unchained:utils';
import yj from 'yieldable-json';

const logger = createLogger('unchained:platform:bulk-import');

const unpackPayload = async ({ payloadId, ...options }, gridFSBucket) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const readStream = gridFSBucket.openDownloadStream(payloadId);
    readStream.on('data', (buffer) => {
      buffers.push(buffer);
    });
    readStream.on('end', () => {
      const buffer = Buffer.concat(buffers);
      logger.profile(`parseAsync`);
      yj.parseAsync(buffer.toString(), undefined, 8, (err, data) => {
        logger.profile(`parseAsync`);
        if (err) {
          reject(err);
          return;
        }
        resolve({ ...data, ...options });
      });
    });
  });
};

export const BulkImportWorker: IWorkerAdapter<any, Record<string, unknown>> = {
  ...BaseAdapter,

  key: 'shop.unchained.worker-plugin.bulk-import',
  label: 'Bulk Import',
  version: '1.0',
  type: 'BULK_IMPORT',

  doWork: async (rawPayload, unchainedAPI) => {
    try {
      const {
        events,
        createShouldUpsertIfIDExists = false,
        skipCacheInvalidation = false,
        authorId = 'root',
      } = rawPayload.payloadId
        ? await unpackPayload(rawPayload, unchainedAPI.bulkImporter.BulkImportPayloads)
        : rawPayload;

      if (!events?.length) throw new Error('No events submitted');

      const bulkImporter = unchainedAPI.bulkImporter.createBulkImporter(
        {
          logger,
          authorId,
          createShouldUpsertIfIDExists,
          skipCacheInvalidation,
        },
        unchainedAPI,
      );
      await events.reduce(async (currentEventPromise, nextEvent) => {
        await currentEventPromise;
        return bulkImporter.prepare(nextEvent);
      }, Promise.resolve());

      const [result, error] = await bulkImporter.execute();
      await bulkImporter.invalidateCaches();

      if (error) {
        return {
          success: false,
          result,
          error,
        };
      }
      return {
        success: true,
        result,
      };
    } catch (err) {
      logger.error(err.message, err);
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(BulkImportWorker);
