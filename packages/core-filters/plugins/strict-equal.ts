import { IFilterAdapter } from '@unchainedshop/types/filters';
import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';

const StrictQualFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.strict-qual',
  label: 'Simple Strict Equal DB Filter',
  version: '0.1',
  orderIndex: 0,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      transformProductSelector: async (lastSelector, options) => {
        const { key, value } = options || {};

        if (key) {
          return {
            ...lastSelector,
            [key]: value !== undefined ? value : { $exists: true },
          };
        }
        return lastSelector;
      },
    };
  },
};

FilterDirector.registerAdapter(StrictQualFilter);
