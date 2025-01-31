import { OrderDelivery as OrderDeliveryType } from '@unchainedshop/types/orders.deliveries';
import { DeliveryProviderType } from 'meteor/unchained:core-delivery';
import { objectInvert } from 'meteor/unchained:utils';
import { Context } from '@unchainedshop/types/api';

const OrderDeliveryMap = {
  OrderDeliveryShipping: DeliveryProviderType.SHIPPING,
  OrderDeliveryPickUp: DeliveryProviderType.PICKUP,
};

export const OrderDelivery = {
  __resolveType: async (obj: OrderDeliveryType, { modules }: Context) => {
    const provider = await modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });

    const invertedProductTypes = objectInvert(OrderDeliveryMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[DeliveryProviderType.SHIPPING];
  },
};
