import { Context } from './api';
import { ModuleMutations, TimestampFields, _ID, FindOptions } from './common';
import { DiscountAdapterActions, IDiscountAdapter } from './discount';
import { OrderPrice } from './orders.pricing';

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id?: _ID;
  orderId: string;
  code?: string;
  total?: OrderPrice;
  trigger?: OrderDiscountTrigger;
  discountKey?: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export type OrderDiscountsModule = {
  // Queries
  findOrderDiscount: (
    params: { discountId: string },
    options: FindOptions
  ) => Promise<OrderDiscount>;
  findOrderDiscounts: (params: {
    orderId: string;
  }) => Promise<Array<OrderDiscount>>;

  // Transformations
  interface: (
    OrderDiscount: OrderDiscount,
    requestContext: Context
  ) => Promise<DiscountAdapterActions>;

  isValid: (
    orderDiscount: OrderDiscount,
    requestContext: Context
  ) => Promise<boolean>;

  // Mutations
  createManualOrderDiscount: (
    doc: OrderDiscount,
    requestContext: Context
  ) => Promise<OrderDiscount>;

  create: (doc: OrderDiscount, userId?: string) => Promise<OrderDiscount>;
  update: (
    orderDiscountId: string,
    doc: OrderDiscount,
    userId?: string
  ) => Promise<OrderDiscount>;
  delete: (
    orderDiscountId: string,
    requestContext: Context
  ) => Promise<OrderDiscount>;

  updateCalculation: (orderDiscountId: string) => Promise<boolean>;
};
