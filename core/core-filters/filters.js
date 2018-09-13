import './db/factories';
import './db/helpers';
import { Filters, FilterTexts } from './db/collections';

export * from './db/schema';
export * from './director';

export { Filters, FilterTexts };

export default () => {
  // configure
  Filters.invalidateFilterCaches();
};
