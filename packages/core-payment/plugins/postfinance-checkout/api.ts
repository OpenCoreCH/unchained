import { PostFinanceCheckout } from 'postfinancecheckout';
import { RefundCreate } from 'postfinancecheckout/src/models/RefundCreate';
import { RefundType } from 'postfinancecheckout/src/models/RefundType';

const { PFCHECKOUT_SPACE_ID, PFCHECKOUT_USER_ID, PFCHECKOUT_SECRET } = process.env;
const SPACE_ID = parseInt(PFCHECKOUT_SPACE_ID as string, 10);
const USER_ID = parseInt(PFCHECKOUT_USER_ID as string, 10);

const getConfig = () => {
  return {
    space_id: SPACE_ID,
    user_id: USER_ID,
    api_secret: PFCHECKOUT_SECRET,
  };
};

const getTransactionService = () => {
  return new PostFinanceCheckout.api.TransactionService(getConfig());
};

const getTransactionCompletionService = () => {
  return new PostFinanceCheckout.api.TransactionCompletionService(getConfig());
};

const getTransactionVoidService = () => {
  return new PostFinanceCheckout.api.TransactionVoidService(getConfig());
};

const getRefundService = () => {
  return new PostFinanceCheckout.api.RefundService(getConfig());
};

const getTransactionPaymentPageService = () => {
  return new PostFinanceCheckout.api.TransactionPaymentPageService(getConfig());
};

const getTransactionIframeService = () => {
  return new PostFinanceCheckout.api.TransactionIframeService(getConfig());
};

const getTransactionLightboxService = () => {
  return new PostFinanceCheckout.api.TransactionLightboxService(getConfig());
};

export const getTransaction = async (
  transactionId: number,
): Promise<PostFinanceCheckout.model.Transaction> => {
  const transactionService = getTransactionService();
  const transaction = await transactionService.read(SPACE_ID, transactionId);
  return transaction.body;
};

export const createTransaction = async (
  transaction: PostFinanceCheckout.model.TransactionCreate,
): Promise<number | null> => {
  const transactionService = getTransactionService();
  const transactionCreateRes = await transactionService.create(SPACE_ID, transaction);
  const transactionCreate = transactionCreateRes.body;
  return transactionCreate.id || null;
};

export const voidTransaction = async (transactionId: number): Promise<boolean> => {
  const transactionVoidService = getTransactionVoidService();
  try {
    await transactionVoidService.voidOnline(SPACE_ID, transactionId);
    return true;
  } catch (e) {
    return false;
  }
};

export const refundTransaction = async (
  transactionId: number,
  orderId: string,
  amount: number,
): Promise<boolean> => {
  const refundService = getRefundService();
  const refund: RefundCreate = {
    transaction: transactionId,
    externalId: orderId,
    amount,
    type: RefundType.MERCHANT_INITIATED_ONLINE,
  };
  try {
    await refundService.refund(SPACE_ID, refund);
    return true;
  } catch (e) {
    return false;
  }
};

export const confirmDeferredTransaction = async (transactionId: number): Promise<boolean> => {
  const transactionCompletionService = getTransactionCompletionService();
  try {
    await transactionCompletionService.completeOnline(SPACE_ID, transactionId);
    return true;
  } catch (e) {
    return false;
  }
};

export const getPaymentPageUrl = async (transactionId: number): Promise<string> => {
  const transactionPaymentPageService = getTransactionPaymentPageService();
  const paymentPageUrl = await transactionPaymentPageService.paymentPageUrl(SPACE_ID, transactionId);
  return paymentPageUrl.body;
};

export const getLightboxJavascriptUrl = async (transactionId: number): Promise<string> => {
  const transactionLightboxService = getTransactionLightboxService();
  const javascriptUrl = await transactionLightboxService.javascriptUrl(SPACE_ID, transactionId);
  return javascriptUrl.body;
};

export const getIframeJavascriptUrl = async (transactionId: number): Promise<string> => {
  const transactionIframeService = getTransactionIframeService();
  const javascriptUrl = await transactionIframeService.javascriptUrl(SPACE_ID, transactionId);
  return javascriptUrl.body;
};
