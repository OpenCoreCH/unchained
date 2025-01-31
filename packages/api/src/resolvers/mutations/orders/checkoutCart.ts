import { Context, Root } from '@unchainedshop/types/api';
import { log, LogLevel } from 'meteor/unchained:logger';
import { OrderCheckoutError } from '../../../errors';
import { getOrderCart } from '../utils/getOrderCart';

export default async function checkoutCart(
  root: Root,
  params: {
    orderId: string;
    orderContext?: any;
    paymentContext?: any;
    deliveryContext?: any;
  },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderId, ...transactionContext } = params;

  log('mutation checkoutCart', { orderId, userId });

  const cart = await getOrderCart({ orderId }, context);

  try {
    const order = await modules.orders.checkout(cart, transactionContext, context);
    return order;
  } catch (error) {
    log(error.message, { userId, orderId: cart._id, level: LogLevel.Error });

    throw new OrderCheckoutError({
      userId,
      orderId: cart._id,
      ...transactionContext,
      detailMessage: error.message,
    });
  }
}
