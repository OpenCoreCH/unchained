import { log } from 'unchained-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function warehousingInterfaces(root, { type }, { userId }) {
  log(`query warehousingInterfaces ${type}`, { userId });
  return WarehousingProviders.findInterfaces({ type });
}
