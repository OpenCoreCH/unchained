import { FilterTypes } from '../db/schema';

export default (type, productIds, allProductIds) => {
  switch (type) {
    case FilterTypes.SWITCH:
      return createSwitchFilterParser(productIds, allProductIds);
    case FilterTypes.RANGE:
      return createRangeFilterParser(productIds, allProductIds);
    default:
      return createDefaultParser(productIds, allProductIds);
  }
};
