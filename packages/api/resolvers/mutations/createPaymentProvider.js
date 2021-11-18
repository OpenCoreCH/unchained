import { log } from 'unchained-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { ProviderConfigurationInvalid } from '../../errors';

export default (root, { paymentProvider }, { userId }) => {
  log('mutation createPaymentProvider', { userId });
  const provider = PaymentProviders.createProvider({
    ...paymentProvider,
    authorId: userId,
  });
  if (!provider) throw new ProviderConfigurationInvalid(paymentProvider);
  return provider;
};
