import { Db } from 'unchained-core-types';
import { Event } from 'unchained-core-types/events';
import { buildDbIndexes } from 'meteor/unchained:utils';

const TWO_DAYS_SEC = 172800;

export const EventsCollection = async (db: Db) => {
  const Events = db.collection<Event>('events');

  await buildDbIndexes(Events, [
    async () =>
      await Events.createIndex(
        { created: -1 },
        { expireAfterSeconds: TWO_DAYS_SEC, name: 'created' }
      ),
    async () => await Events.createIndex({ type: 1 }, { name: 'type' }),
  ]);

  return Events;
};
