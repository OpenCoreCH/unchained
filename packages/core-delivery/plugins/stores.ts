import { IDeliveryAdapter } from '@unchainedshop/types/delivery';
import { DeliveryAdapter, DeliveryDirector, DeliveryProviderType } from 'meteor/unchained:core-delivery';

const PickMup: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.stores',
  label: 'Manual Pickup',
  version: '1.0',

  typeSupported: (type) => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config, context) => {
    const getStores = () => {
      return config.reduce((current, item) => {
        if (item.key === 'stores') return JSON.parse(item.value);
        return current;
      }, {});
    };

    return {
      ...DeliveryAdapter.actions(config, context),

      isActive() {
        return true;
      },

      configurationError() {
        return null;
      },

      pickUpLocationById: async (id) => {
        return getStores().find((store) => store._id === id);
      },

      pickUpLocations: async () => {
        return getStores();
      },
    };
  },
};

DeliveryDirector.registerAdapter(PickMup);
