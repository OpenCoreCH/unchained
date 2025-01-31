import { IDeliveryAdapter, IDeliveryDirector } from '@unchainedshop/types/delivery';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BaseDirector } from 'meteor/unchained:utils';
import { DeliveryError } from './DeliveryError';

const baseDirector = BaseDirector<IDeliveryAdapter>('DeliveryDirector');

export const DeliveryDirector: IDeliveryDirector = {
  ...baseDirector,

  actions: (deliveryProvider, deliveryContext, requestContext) => {
    const Adapter = baseDirector.getAdapter(deliveryProvider.adapterKey);

    const context = { ...deliveryContext, ...requestContext };
    const adapter = Adapter.actions(deliveryProvider.configuration, context);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch (error) {
          return DeliveryError.ADAPTER_NOT_FOUND;
        }
      },

      estimatedDeliveryThroughput: async (warehousingThroughputTime) => {
        try {
          const throughput = await adapter.estimatedDeliveryThroughput(warehousingThroughputTime);
          return throughput;
        } catch (error) {
          log('Delivery Director -> Error while estimating delivery throughput', {
            level: LogLevel.Warning,
            ...error,
          });
          return null;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          log('Delivery Director -> Error while checking if is active', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      isAutoReleaseAllowed: () => {
        try {
          return adapter.isAutoReleaseAllowed();
        } catch (error) {
          log('Delivery Director -> Error while checking if auto release is allowed', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      send: async () => {
        return adapter.send();
      },

      pickUpLocationById: async (locationId) => {
        return adapter.pickUpLocationById(locationId);
      },

      pickUpLocations: async () => {
        return adapter.pickUpLocations();
      },
    };
  },
};
