import { Db } from '@unchainedshop/types/common';
import { FiltersSettingsOptions } from '@unchainedshop/types/filters';
import crypto from 'crypto';
import { FiltersCollection } from '../db/FiltersCollection';

const updateIfHashChanged = async (Collection, selector, doc) => {
  const _id = Object.values(selector).join(':');
  try {
    const hash = crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex');
    await Collection.updateOne(
      {
        ...selector,
        hash: { $ne: hash },
      },
      {
        $set: {
          ...doc,
          hash,
        },
        $setOnInsert: {
          _id,
        },
      },
      { upsert: true },
    );
  } catch (e) { } // eslint-disable-line
  return _id;
};

export default async function mongodbCache(db: Db) {
  const { FilterProductIdCache } = await FiltersCollection(db);

  return {
    async getCachedProductIds(filterId) {
      const filterProductIdCache = await FilterProductIdCache.find(
        {
          filterId,
        },
        { projection: { productIds: 1, filterOptionValue: 1 } },
      ).toArray();

      const allProductIds =
        filterProductIdCache.find((cache) => cache.filterOptionValue === null)?.productIds || [];
      const productIdsMap = Object.fromEntries(
        filterProductIdCache
          .filter((cache) => cache.filterOptionValue !== null)
          .map((cache) => [cache.filterOptionValue, cache.productIds]),
      );
      return [allProductIds, productIdsMap];
    },
    async setCachedProductIds(filterId, productIds, productIdsMap) {
      const baseCacheId = await updateIfHashChanged(
        FilterProductIdCache,
        { filterId, filterOptionValue: null },
        { productIds },
      );
      const cacheIds = await Promise.all(
        Object.entries(productIdsMap).map(async ([filterOptionValue, optionProductIds]) =>
          updateIfHashChanged(
            FilterProductIdCache,
            { filterId, filterOptionValue },
            { productIds: optionProductIds },
          ),
        ),
      );
      const allCacheRecords = cacheIds.concat([baseCacheId]).filter(Boolean);
      // await FilterProductIdCache.deleteMany({ filterId, _id: { $nin: allCacheRecords } });
      return allCacheRecords.length;
    },
  } as {
    getCachedProductIds: FiltersSettingsOptions['getCachedProductIds'];
    setCachedProductIds: FiltersSettingsOptions['setCachedProductIds'];
  };
}
