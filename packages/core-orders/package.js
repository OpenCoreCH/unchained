Package.describe({
  name: 'unchained:core-orders',
  version: '0.55.1',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  hashids: '2.0.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:utils@0.55.1');
  api.use('unchained:core-files@0.55.1');
  api.use('unchained:core-logger@0.55.1');
  api.use('unchained:core-pricing@0.55.1');
  api.use('unchained:core-users@0.55.1');
  api.use('unchained:core-countries@0.55.1');
  api.use('unchained:core-documents@0.55.1');
  api.use('unchained:core-delivery@0.55.1');
  api.use('unchained:core-products@0.55.1');
  api.use('unchained:core-discounting@0.55.1');
  api.use('unchained:core-payment@0.55.1');
  api.use('unchained:core-quotations@0.55.1');
  api.use('unchained:core-subscriptions@0.55.1');

  api.mainModule('orders.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-orders');
  api.mainModule('orders-tests.js');
});
