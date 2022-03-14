import { DeliveryProviderHelperTypes } from '@unchainedshop/types/delivery';
import crypto from 'crypto';
import { DeliveryPricingDirector } from 'meteor/unchained:core-delivery';

export const DeliveryProvider: DeliveryProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.delivery.findInterface(obj);

    if (!Interface) return null;

    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
    };
  },

  isActive(deliveryProvider, _, requestContext) {
    const { modules } = requestContext;
    return modules.delivery.isActive(deliveryProvider, requestContext);
  },

  async configurationError(obj, _, requestContext) {
    const { modules } = requestContext;
    return modules.delivery.configurationError(obj, requestContext);
  },

  async simulatedPrice(
    deliveryProvider,
    { currency: currencyCode, orderId, useNetPrice, context: providerContext },
    requestContext,
  ) {
    const { modules, services, countryContext: country, user } = requestContext;
    const order = await modules.orders.findOrder({ orderId });
    const orderDelivery =
      order &&
      (await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      }));

    const currency =
      currencyCode ||
      (await services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: country,
        },
        requestContext,
      ));

    const pricingDirector = await DeliveryPricingDirector.actions(
      {
        country,
        currency,
        quantity: 1,
        provider: deliveryProvider,
        order,
        orderDelivery,
        providerContext,
        user,
      },
      requestContext,
    );

    const calculated = await pricingDirector.calculate();
    if (!calculated || !calculated.length) return null;

    const pricing = pricingDirector.resultSheet();

    const orderPrice = pricing.total({ useNetPrice }) as {
      amount: number;
      currency: string;
    };

    return {
      _id: crypto
        .createHash('sha256')
        .update([deliveryProvider._id, country, useNetPrice, order ? order._id : ''].join(''))
        .digest('hex'),
      amount: orderPrice.amount,
      currencyCode: orderPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
};
