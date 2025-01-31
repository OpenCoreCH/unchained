import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { Currency } from '@unchainedshop/types/currencies';

export default async function createCurrency(
  root: Root,
  { currency }: { currency: Currency },
  { userId, modules }: Context,
) {
  log('mutation createCurrency', { userId });
  const currencyId = await modules.currencies.create(
    {
      ...currency,
      authorId: userId,
    },
    userId,
  );

  return modules.currencies.findCurrency({ currencyId });
}
