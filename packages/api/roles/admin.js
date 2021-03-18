export default (role, actions) => {
  role.allow(actions.viewEvent, () => true);
  role.allow(actions.viewEvents, () => true);
  role.allow(actions.viewUser, () => true);
  role.allow(actions.viewUsers, () => true);
  role.allow(actions.viewPaymentProviders, () => true);
  role.allow(actions.viewPaymentProvider, () => true);
  role.allow(actions.viewPaymentInterfaces, () => true);
  role.allow(actions.viewDeliveryProviders, () => true);
  role.allow(actions.viewDeliveryProvider, () => true);
  role.allow(actions.viewDeliveryInterfaces, () => true);
  role.allow(actions.viewWarehousingProviders, () => true);
  role.allow(actions.viewWarehousingProvider, () => true);
  role.allow(actions.viewWarehousingInterfaces, () => true);
  role.allow(actions.viewTranslations, () => true);
  role.allow(actions.viewOrders, () => true);
  role.allow(actions.viewOrder, () => true);
  role.allow(actions.viewProducts, () => true);
  role.allow(actions.manageLanguages, () => true);
  role.allow(actions.manageCountries, () => true);
  role.allow(actions.manageProducts, () => true);
  role.allow(actions.manageCurrencies, () => true);
  role.allow(actions.managePaymentProviders, () => true);
  role.allow(actions.manageDeliveryProviders, () => true);
  role.allow(actions.manageWarehousingProviders, () => true);
  role.allow(actions.manageUsers, () => true);
  role.allow(actions.manageAssortments, () => true);
  role.allow(actions.manageFilters, () => true);
  role.allow(actions.updateCart, () => true);
  role.allow(actions.createCart, () => true);
  role.allow(actions.sendEmail, () => true);
  role.allow(actions.updateUser, () => true);
  role.allow(actions.updateOrder, () => true);
  role.allow(actions.updateOrderDiscount, () => true);
  role.allow(actions.updateOrderItem, () => true);
  role.allow(actions.updateOrderDelivery, () => true);
  role.allow(actions.updateOrderPayment, () => true);
  role.allow(actions.markOrderConfirmed, () => true);
  role.allow(actions.markOrderPaid, () => true);
  role.allow(actions.markOrderDelivered, () => true);
  role.allow(actions.viewLogs, () => true);
  role.allow(actions.viewUserRoles, () => true);
  role.allow(actions.viewUserOrders, () => true);
  role.allow(actions.viewUserQuotations, () => true);
  role.allow(actions.viewUserPublicInfos, () => true);
  role.allow(actions.viewUserPrivateInfos, () => true);
  role.allow(actions.viewUserSubscriptions, () => true);
  role.allow(actions.reviewProduct, () => true);
  role.allow(actions.updateProductReview, () => true);
  role.allow(actions.manageProductReviews, () => true);
  role.allow(actions.requestQuotation, () => true);
  role.allow(actions.viewQuotations, () => true);
  role.allow(actions.viewQuotation, () => true);
  role.allow(actions.manageQuotations, () => true);
  role.allow(actions.answerQuotation, () => true);
  role.allow(actions.bookmarkProduct, () => true);
  role.allow(actions.manageBookmarks, () => true);
  role.allow(actions.voteProductReview, () => true);
  role.allow(actions.manageWorker, () => true);
  role.allow(actions.viewSubscriptions, () => true);
  role.allow(actions.viewSubscription, () => true);
  role.allow(actions.updateSubscription, () => true);
  role.allow(actions.registerPaymentCredentials, () => true);
  role.allow(actions.managePaymentCredentials, () => true);
  role.allow(actions.bulkImport, () => true);
};
