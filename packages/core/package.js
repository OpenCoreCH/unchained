Package.describe({
  name: 'unchained:core',
  version: '1.0.0-rc.3',
  summary: 'Unchained Engine Core: Core Umbrella',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-accountsjs@1.0.0-rc.3');
  api.use('unchained:core-assortments@1.0.0-rc.3');
  api.use('unchained:core-bookmarks@1.0.0-rc.3');
  api.use('unchained:core-countries@1.0.0-rc.3');
  api.use('unchained:core-currencies@1.0.0-rc.3');
  api.use('unchained:core-delivery@1.0.0-rc.3');
  api.use('unchained:core-enrollments@1.0.0-rc.3');
  api.use('unchained:core-events@1.0.0-rc.3');
  api.use('unchained:core-filters@1.0.0-rc.3');
  api.use('unchained:core-files-next@1.0.0-rc.3');
  api.use('unchained:core-languages@1.0.0-rc.3');
  api.use('unchained:core-messaging@1.0.0-rc.3');
  api.use('unchained:core-orders@1.0.0-rc.3');
  api.use('unchained:core-payment@1.0.0-rc.3');
  api.use('unchained:core-products@1.0.0-rc.3');
  api.use('unchained:core-quotations@1.0.0-rc.3');
  api.use('unchained:core-users@1.0.0-rc.3');
  api.use('unchained:core-warehousing@1.0.0-rc.3');
  api.use('unchained:core-worker@1.0.0-rc.3');

  api.imply([
    'unchained:core-accountsjs',
    'unchained:core-assortments',
    'unchained:core-bookmarks',
    'unchained:core-countries',
    'unchained:core-currencies',
    'unchained:core-delivery',
    'unchained:core-enrollments',
    'unchained:core-events',
    'unchained:core-filters',
    'unchained:core-files-next',
    'unchained:core-languages',
    'unchained:core-messaging',
    'unchained:core-orders',
    'unchained:core-payment',
    'unchained:core-products',
    'unchained:core-quotations',
    'unchained:core-users',
    'unchained:core-warehousing',
    'unchained:core-worker',
  ]);

  api.mainModule('src/core-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core@1.0.0-rc.3');

  api.mainModule('test/core-index.tests.js');
});
