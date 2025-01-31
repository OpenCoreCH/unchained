import { Context } from '@unchainedshop/types/api';
import { Address } from '@unchainedshop/types/common';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { OrderDelivery, OrderDeliveryDiscount } from '@unchainedshop/types/orders.deliveries';

type HelperType<T> = (orderDelivery: OrderDelivery, _: never, context: Context) => T;

interface OrderDeliveryShippingHelperTypes {
  address: HelperType<Address>;
  discounts: HelperType<Promise<Array<OrderDeliveryDiscount>>>;
  provider: HelperType<Promise<DeliveryProvider>>;
  status: HelperType<string>;
}

export const OrderDeliveryShipping: OrderDeliveryShippingHelperTypes = {
  address: (obj) => {
    return obj.context?.address;
  },

  status: (obj, _, { modules }) => {
    return modules.orders.deliveries.normalizedStatus(obj);
  },

  provider: async (obj, _, { modules }) => {
    return modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });
  },

  discounts: async (obj, _, { modules }) => {
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.deliveries.pricingSheet(obj, order.currency);
    if (pricingSheet.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricingSheet.discountPrices().map((discount) => ({
        item: obj,
        ...discount,
      }));
    }
    return [];
  },
};
