import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateDeliveryProvider(
  root: Root,
  params: { deliveryProvider: DeliveryProvider; deliveryProviderId: string },
  { modules, userId }: Context,
) {
  const { deliveryProvider, deliveryProviderId } = params;

  log(`mutation updateDeliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  if (!(await modules.delivery.providerExists({ deliveryProviderId })))
    throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return modules.delivery.update(deliveryProviderId, deliveryProvider, userId);
}
