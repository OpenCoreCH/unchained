import { IOrderPricingAdapter } from '@unchainedshop/types/orders.pricing';
import { OrderPricingDirector, OrderPricingAdapter } from 'meteor/unchained:core-orders';

const OrderDelivery: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-delivery',
  version: '1.0',
  label: 'Add Delivery Fees to Order',
  orderIndex: 10,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderDelivery, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // just add tax + net price to order pricing
        if (orderDelivery) {
          const pricing = modules.orders.deliveries.pricingSheet(orderDelivery, order.currency);
          const tax = pricing.taxSum();
          const shipping = pricing.gross();

          pricingAdapter.resultSheet().addDelivery({ amount: shipping });
          if (tax !== 0) {
            pricingAdapter.resultSheet().addTaxes({ amount: tax });
          }
        }
        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderDelivery);
