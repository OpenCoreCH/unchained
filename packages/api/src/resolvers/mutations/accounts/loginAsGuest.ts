import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function loginAsGuest(root: Root, _: any, context: Context) {
  const { modules } = context;

  log('mutation loginAsGuest');

  const loginToken = await modules.accounts.loginWithService({ service: 'guest' }, context);

  return loginToken;
}
