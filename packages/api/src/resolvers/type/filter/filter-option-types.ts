import { Context } from '@unchainedshop/types/api';
import { FilterOption as FilterOptionType, FilterText } from '@unchainedshop/types/filters';

type HelperType<P, T> = (filterOption: FilterOptionType, params: P, context: Context) => T;

type FilterOptionHelperTypes = {
  _id: HelperType<never, string>;
  texts: HelperType<{ forceLocale?: string }, Promise<FilterText>>;
  value: HelperType<never, string>;
};

export const FilterOption: FilterOptionHelperTypes = {
  _id(obj) {
    return `${obj._id}:${obj.filterOption}`;
  },

  value(obj) {
    return obj.filterOption;
  },

  async texts(obj, { forceLocale }, { modules, localeContext }) {
    return modules.filters.texts.findLocalizedText({
      filterId: obj._id,
      filterOptionValue: obj.filterOption,
      locale: forceLocale || localeContext.normalized,
    });
  },
};
