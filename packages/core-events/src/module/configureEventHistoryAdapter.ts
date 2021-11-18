import { Collection } from 'unchained-core-types';
import { Event } from 'unchained-core-types/events';

import { setEmitHistoryAdapter, EmitAdapter } from 'unchained-events';

export const configureEventHistoryAdapter = (Events: Collection<Event>) => {
  const adapter: EmitAdapter = {
    subscribe: () => {
      // Do nothing
    },
    publish: async (eventName, payload: any) => {
      await Events.insertOne({
        type: eventName,
        payload,
        context: {},
        created: new Date(),
      });
    },
  };
  setEmitHistoryAdapter(adapter);
};
