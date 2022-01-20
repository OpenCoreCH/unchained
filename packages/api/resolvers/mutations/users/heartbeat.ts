import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function heartbeat(
  root: Root,
  _: any,
  {
    countryContext,
    localeContext,
    modules,
    remoteAddress,
    remotePort,
    userAgent,
    userId,
  }: Context
) {
  log(`mutation updateHeartbeat ${remoteAddress}`, { userId });

  if (!userId) throw new UserNotFoundError({ userId });

  if (!(await modules.users.userExists({ userId }))) {
    throw new UserNotFoundError({ userId });
  }

  const user = await modules.users.updateHeartbeat(userId, {
    countryContext,
    locale: localeContext.normalized,
    remoteAddress,
    remotePort,
    userAgent,
  });

  return user;
}
