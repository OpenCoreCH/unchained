import { OrderPosition } from '@unchainedshop/types/orders.positions';
import {
  IProductPricingAdapter,
  IProductPricingDirector,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  ProductPricingContext,
} from '@unchainedshop/types/products.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { ProductPricingSheet } from './ProductPricingSheet';

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export const ProductPricingDirector: IProductPricingDirector = {
  ...baseDirector,

  async buildPricingContext(
    {
      item: orderPosition,
      ...context
    }: {
      item: OrderPosition;
    } & ProductPricingContext,
    requestContext,
  ) {
    const { modules } = requestContext;

    if (!orderPosition) {
      return {
        discounts: [],
        ...context,
        ...requestContext,
      } as ProductPricingAdapterContext;
    }

    const product = await modules.products.findProduct({
      productId: orderPosition.productId,
    });

    const order = await modules.orders.findOrder({
      orderId: orderPosition.orderId,
    });
    const user = await modules.users.findUserById(order.userId);
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: orderPosition.orderId,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...requestContext,
      discounts,
      order,
      product,
      quantity: orderPosition.quantity,
      user,
    };
  },

  async actions(pricingContext, requestContext) {
    const actions = await baseDirector.actions(pricingContext, requestContext, this.buildPricingContext);
    return {
      ...actions,
      resultSheet() {
        const calculation = actions.getCalculation();
        const context = actions.getContext();

        return ProductPricingSheet({
          calculation,
          currency: context.currency,
          quantity: context.quantity,
        });
      },
    };
  },
};
