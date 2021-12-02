import {
  registerAdapter,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import { Orders } from 'meteor/unchained:core-orders';
import bodyParser from 'body-parser';
import { OrderPricingSheet } from 'meteor/unchained:core-pricing';
import {
  acl,
  roles,
  useMiddlewareWithCurrentContext,
} from 'meteor/unchained:api';
import crypto from 'crypto';
import fetch from 'isomorphic-unfetch';
import ClientOAuth2 from 'client-oauth2';
import { Mongo } from 'meteor/mongo';

const { checkAction } = acl;
const { actions } = roles;

const BityCredentials = new Mongo.Collection('bity_credentials');

let currentToken;

const {
  BITY_CLIENT_ID,
  BITY_CLIENT_SECRET,
  BITY_BANK_ACCOUNT_IBAN,
  BITY_BANK_ACCOUNT_ADDRESS,
  BITY_BANK_ACCOUNT_CITY,
  BITY_BANK_ACCOUNT_COUNTRY,
  BITY_BANK_ACCOUNT_NAME,
  BITY_BANK_ACCOUNT_ZIP,
  BITY_API_ENDPOINT = 'https://exchange.api.bity.com',
  BITY_OAUTH_INIT_PATH = '/graphql/bity-auth',
  BITY_OAUTH_REDIRECT_URI = 'http://localhost:4010/graphql/bity',
  BITY_OAUTH_STATE = 'unchained',
  BITY_OAUTH_PATH = '/graphql/bity',
} = process.env;

const createBityAuth = () => {
  if (!BITY_CLIENT_ID) throw new Error('Bity plugin is not setup');
  return new ClientOAuth2({
    clientId: BITY_CLIENT_ID,
    clientSecret: BITY_CLIENT_SECRET,
    accessTokenUri: 'https://connect.bity.com/oauth2/token',
    authorizationUri: 'https://connect.bity.com/oauth2/auth',
    redirectUri: BITY_OAUTH_REDIRECT_URI,
    state: BITY_OAUTH_STATE,
    scopes: [
      'https://auth.bity.com/scopes/exchange.place',
      'https://auth.bity.com/scopes/exchange.history',
      'offline_access',
    ],
    sendClientCredentialsInBody: true,
  });
};

const upsertBityCredentials = (user) => {
  currentToken = user;

  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash('sha256')
    .update(String(BITY_CLIENT_SECRET))
    .digest('base64')
    .substr(0, 32);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(user.data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  BityCredentials.upsert(
    { _id: `${BITY_CLIENT_ID}-${BITY_OAUTH_REDIRECT_URI}-${BITY_OAUTH_STATE}` },
    {
      $set: {
        data: {
          iv: iv.toString('hex'),
          encryptedData: encrypted.toString('hex'),
        },
        expires: user.expires,
      },
    }
  );
};

const getTokenFromDb = (bityAuth) => {
  const credentials = BityCredentials.findOne({
    _id: `${BITY_CLIENT_ID}-${BITY_OAUTH_REDIRECT_URI}-${BITY_OAUTH_STATE}`,
  });
  if (!credentials?.data) return null;

  const iv = Buffer.from(credentials.data.iv, 'hex');
  const encryptedText = Buffer.from(credentials.data.encryptedData, 'hex');
  const key = crypto
    .createHash('sha256')
    .update(String(BITY_CLIENT_SECRET))
    .digest('base64')
    .substr(0, 32);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const data = JSON.parse(decrypted.toString());

  const token = bityAuth.createToken(
    data.access_token,
    data.refresh_token,
    data.token_type,
    { data }
  );
  return token;
};

const refreshBityUser = async () => {
  if (currentToken) {
    const newToken = await currentToken.refresh();
    if (newToken) {
      upsertBityCredentials(newToken);
    }
  }
};

const signPayload = (...parts) => {
  const resultString = parts.filter(Boolean).join('');
  const signKeyInBytes = Buffer.from(BITY_CLIENT_ID, 'hex');

  const signedString = crypto
    .createHmac('sha256', signKeyInBytes)
    .update(resultString)
    .digest('hex');
  return signedString;
};

const bityExchangeFetch = async ({ path, params }) => {
  const body = params && JSON.stringify(params);
  const doFetch = async () => {
    const response = await fetch(`${BITY_API_ENDPOINT}${path}`, {
      method: body ? 'POST' : 'GET',
      body: body || undefined,
      headers: {
        Authorization: `Bearer ${currentToken.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  };
  const response = await doFetch();
  if (response.status === 401) {
    await refreshBityUser();
    return doFetch();
  }
  return response;
};

useMiddlewareWithCurrentContext(BITY_OAUTH_INIT_PATH, async (req, res) => {
  if (req.method === 'GET') {
    try {
      const resolvedContext = req.unchainedContext;
      checkAction(actions.managePaymentProviders, resolvedContext?.userId);

      const bityAuth = createBityAuth();
      const uri = bityAuth.code.getUri();
      paymentLogger.info(`Bity Webhook: Login ${uri}`);
      res.writeHead(302, {
        Location: uri,
      });
      return res.end();
    } catch (e) {
      paymentLogger.warn(`Bity Webhook: Failed with ${e.message}`);
      res.writeHead(503);
      return res.end(JSON.stringify(e));
    }
  }
  res.writeHead(404);
  return res.end();
});

useMiddlewareWithCurrentContext(BITY_OAUTH_PATH, async (req, res, next) => {
  bodyParser.urlencoded({ extended: false })(req, res, next);
});

useMiddlewareWithCurrentContext(BITY_OAUTH_PATH, async (req, res) => {
  if (req.method === 'GET') {
    try {
      const resolvedContext = req.unchainedContext;
      checkAction(actions.managePaymentProviders, resolvedContext?.userId);
      const bityAuth = createBityAuth();
      const user = await bityAuth.code.getToken(req.originalUrl);
      upsertBityCredentials(user);
      res.writeHead(200);
      return res.end('Bity Credentials Setup Complete');
    } catch (e) {
      paymentLogger.warn(`Bity Webhook: Failed with ${e.message}`);
      res.writeHead(503);
      return res.end(JSON.stringify(e));
    }
  }
  res.writeHead(404);
  return res.end();
});

class Bity extends PaymentAdapter {
  static key = 'shop.unchained.payment.bity';

  static label = 'Bity';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  loadToken() {
    if (currentToken) return currentToken;
    if (!this.bityAuth) this.bityAuth = createBityAuth();
    if (this.bityAuth) {
      currentToken = getTokenFromDb(this.bityAuth);
    }
    return currentToken;
  }

  // eslint-disable-next-line
  configurationError() {
    this.loadToken();
    if (!currentToken) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    return null;
  }

  isActive() {
    if (this.configurationError() === null) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  // eslint-disable-next-line
  async estimateBityOrder(params) {
    const response = await bityExchangeFetch({
      path: '/v2/orders/estimate',
      params,
    });
    if (response?.status !== 200) {
      paymentLogger.error('Bity Plugin: Response invalid', {
        params,
        route: '/orders/estimate',
        response,
      });
      throw new Error('Could not estimate Bity Currency Conversion');
    }
    return response.json();
  }

  // eslint-disable-next-line
  async createBityOrder(params) {
    const response = await bityExchangeFetch({
      path: '/v2/orders',
      params,
    });
    if (response?.status !== 201) {
      paymentLogger.error('Bity Plugin: Response invalid', {
        params,
        route: '/orders',
        response,
      });
      throw new Error('Could not create Bity Order');
    }
    return response.headers.get('Location');
  }

  async sign({ transactionContext = {} } = {}) {
    // Signing the order will estimate a new order in bity and sign it with private data
    paymentLogger.info(`Bity Plugin: Sign ${JSON.stringify(transactionContext)}`);

    const { orderPayment } = this.context;
    const order = orderPayment.order();
    const pricing = new OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
    });
    const totalAmount = Math.round(pricing?.total().amount / 10 || 0) * 10;

    const payload = await this.estimateBityOrder({
      output: {
        currency: 'EUR',
        amount: `${totalAmount / 100}`,
      },
      input: {
        currency: 'BTC',
      },
    });

    const signature = signPayload(
      JSON.stringify(payload),
      order._id,
      totalAmount,
      BITY_CLIENT_SECRET
    );
    return JSON.stringify({
      payload,
      signature,
    });
  }

  // eslint-disable-next-line
  async charge(cty) {
    const { order } = this.context;
    const { bityPayload, bitySignature } = order?.context || {};

    const pricing = new OrderPricingSheet({
      calculation: order.calculation,
      currency: order.currency,
    });
    const totalAmount = Math.round(pricing?.total().amount / 10 || 0) * 10;

    const signature = signPayload(
      JSON.stringify(bityPayload),
      order._id,
      totalAmount,
      BITY_CLIENT_SECRET
    );
    if (bitySignature !== signature) {
      paymentLogger.warn(
        `Bity Plugin: Signature Mismatch ${JSON.stringify(
          bityPayload
        )} ${bitySignature}`
      );
      throw new Error('Signature Mismatch');
    }

    const path = await this.createBityOrder({
      input: {
        amount: bityPayload.input.amount,
        currency: bityPayload.input.currency,
      },
      output: {
        currency: bityPayload.output.currency,
        type: 'bank_account',
        iban: BITY_BANK_ACCOUNT_IBAN,
        reference: order._id,
        owner: {
          address: BITY_BANK_ACCOUNT_ADDRESS,
          city: BITY_BANK_ACCOUNT_CITY,
          country: BITY_BANK_ACCOUNT_COUNTRY,
          name: BITY_BANK_ACCOUNT_NAME,
          zip: BITY_BANK_ACCOUNT_ZIP,
        },
      },
    });
    paymentLogger.info(`Bity Plugin: Prepared Bity Order`, path);
    const response = await bityExchangeFetch({ path });
    const bityOrder = await response?.json();
    if (!bityOrder) {
      paymentLogger.warn(
        `Bity Plugin: Bity Order not found ${JSON.stringify(
          path
        )} ${bitySignature}`
      );
      throw new Error('Bity Order not Found');
    }
    Orders.update(
      { _id: order._id },
      {
        $set: { 'context.bityOrder': bityOrder },
      }
    );
    return false;
  }
}

registerAdapter(Bity);
