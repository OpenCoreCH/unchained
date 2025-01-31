import { Context, Root } from '@unchainedshop/types/api';
import { log, LogLevel } from 'meteor/unchained:logger';

export default async function logout(root: Root, params: { token: string }, context: Context) {
  const { modules, userId } = context;

  log('mutation logout', { userId });

  const loggedOut = await modules.accounts.logout(params, context);

  if (loggedOut.error)
    log('Error while logging out', {
      logLevel: LogLevel.Error,
      ...loggedOut.error,
    });

  return { success: loggedOut.success };
}
