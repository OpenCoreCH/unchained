import { FilterDirector } from 'meteor/unchained:core-filters';
import { Filters } from '../db/collections';

export default ({ query, filterSelector, ...rest }) =>
  async (productIdResolver) => {
    const { filterQuery, forceLiveCollection } = query;
    if (!filterQuery || filterQuery.length === 0) return productIdResolver;

    const [selector, allProductIds] = await Promise.all([
      filterSelector,
      productIdResolver,
    ]);
    const filters = selector ? Filters.find(selector).fetch() : [];

    const director = new FilterDirector({
      query,
      ...rest,
    });

    const intersectedProductIds = await director.intersectProductIds(
      allProductIds,
      {
        filterSelector,
        filters,
        filterQuery,
        forceLiveCollection,
      }
    );

    return [...intersectedProductIds];
  };
