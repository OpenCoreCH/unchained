import mongodb from 'mongodb';
import * as AssortmentHandlers from './handlers/assortment';
import * as FilterHandlers from './handlers/filter';
import * as ProductHandlers from './handlers/product';

const allowedOperations = ['create', 'remove', 'update'];

const runPrepareAsync = async (entity, operation, event, context, requestContext) => {
  let entityOperation;
  switch (entity) {
    case 'ASSORTMENT':
      entityOperation = AssortmentHandlers[operation];
      break;
    case 'PRODUCT':
      entityOperation = ProductHandlers[operation];
      break;
    case 'FILTER':
      entityOperation = FilterHandlers[operation];
      break;
    default:
      throw new Error(`Entity ${event.entity} unknown`);
  }

  if (typeof entityOperation !== 'function') {
    throw new Error(`Operation ${operation} for entity ${event.entity} unknown`);
  }

  return entityOperation(event.payload, context, requestContext);
};

export const createBulkImporter = (options, requestContext) => {
  const bulkOperations = {};
  const preparationIssues = [];
  const processedOperations = {};
  const { logger } = options;

  const bulk = (Collection) => {
    const raw = Collection.rawCollection();
    bulkOperations[raw.namespace.collection] = Collection.rawCollection().initializeOrderedBulkOp();
    return bulkOperations[raw.namespace.collection];
  };

  const context = {
    ...options,
    bulk,
  };

  logger.info(
    `Configure event import with options: createShouldUpsertIfIDExists=${options.createShouldUpsertIfIDExists} skipCacheInvalidation=${options.skipCacheInvalidation}`,
  );

  return {
    prepare: async (event) => {
      const entity = event.entity.toUpperCase();
      const operation = event.operation.toLowerCase();

      if (!allowedOperations.includes(operation)) {
        throw new Error(`Operation ${event.operation} unknown`);
      }
      if (!event.payload) {
        throw new Error(`Payload missing in ${JSON.stringify(event)}`);
      }

      logger.verbose(`${operation} ${entity} ${event.payload._id} [PREPARE]`);
      logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`, {
        level: 'verbose',
      });

      try {
        await runPrepareAsync(entity, operation, event, context, requestContext);
        if (!processedOperations[entity]) processedOperations[entity] = {};
        if (!processedOperations[entity][operation]) processedOperations[entity][operation] = [];
        processedOperations[entity][operation].push(event.payload._id);
        logger.verbose(`${operation} ${entity} ${event.payload._id} [SUCCESS]`);
      } catch (e) {
        logger.verbose(`${operation} ${entity} ${event.payload._id} [FAILED]: ${e.message}`);
        preparationIssues.push({
          operation,
          entity,
          payloadId: event.payload._id,
          errorCode: e.name,
          errorMessage: e.message,
        });
      } finally {
        logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`, {
          level: 'verbose',
        });
      }
    },
    execute: async () => {
      logger.info(`Execute bulk operations for: ${Object.keys(bulkOperations).join(', ')}`);
      const operationResults = {
        processedOperations,
        processedBulkOperations: await Promise.all(
          Object.values(bulkOperations).map((o) => o.execute()),
        ),
      };
      if (preparationIssues?.length) {
        logger.error(
          `${preparationIssues.length} issues occured while preparing events, import finished with errors`,
        );
        const errors = {};
        errors.preparationIssues = preparationIssues;
        return [operationResults, errors];
      }
      logger.info(`Import finished without errors`);
      return [operationResults, null];
    },
    invalidateCaches: async () => {
      if (options?.skipCacheInvalidation) return;
      await requestContext.modules.assortments.invalidateCache();
      await requestContext.modules.filters.invalidateCache({}, requestContext);
    },
  };
};

export const createBulkImporterFactory = (db) => {
  // Increase the chunk size to 5MB to get around chunk sorting limits of mongodb (weird error above 100 MB)
  const options = { bucketName: 'bulk_import_payloads', chunkSizeBytes: 5 * 1024 * 1024 };
  const BulkImportPayloads = new mongodb.GridFSBucket(db, options);

  return {
    BulkImportPayloads,
    createBulkImporter,
  };
};
