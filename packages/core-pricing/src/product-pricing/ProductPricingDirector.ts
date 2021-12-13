import {
  Order,
  OrderDiscount,
  OrderPosition,
} from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { BasePricingDirector } from 'src/basePricing/BasePricingDirector';
import {
  ProductPricingCalculation,
  ProductPricingSheet,
} from './ProductPricingSheet';

interface ProductPricingContext {
  country?: string;
  currency?: string;
  discounts?: Array<OrderDiscount>;
  order?: Order;
  product?: any; // TODO: update with product type
  quantity?: number;
  user?: User;
}

export class ProductPricingDirector extends BasePricingDirector<
  ProductPricingContext,
  ProductPricingCalculation
> {
  buildPricingContext({
    item,
    ...pricingContext
  }: {
    item: OrderPosition;
  }): ProductPricingContext {
    if (!item)
      return {
        discounts: [],
        ...pricingContext,
      };

    // TODO: use modules
    /* @ts-ignore */
    const product = item.product();
    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    const user = order.user();
    const discounts = order.discounts();

    return {
      country: order.countryCode,
      currency: order.currency,
      discounts,
      order,
      product,
      quantity: item.quantity,
      user,
    };
  }

  resultSheet() {
    return ProductPricingSheet({
      calculation: this.calculation,
      currency: this.pricingContext.currency,
      quantity: this.pricingContext.quantity,
    });
  }
}
