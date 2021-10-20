Package.describe({
  name: 'unchained:core-quotations',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine Core: Quotations',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:core-files-next@1.0.0-beta14');
  api.use('unchained:utils@1.0.0-beta14');
  api.use('unchained:core-users@1.0.0-beta14');
  api.use('unchained:core-products@1.0.0-beta14');
  api.use('unchained:core-countries@1.0.0-beta14');
  api.use('unchained:core-logger@1.0.0-beta14');
  api.use('unchained:core-worker@1.0.0-beta14');

  api.mainModule('quotations.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-quotations');
  api.mainModule('quotations-tests.js');
});
