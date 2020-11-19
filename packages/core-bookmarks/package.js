Package.describe({
  name: 'unchained:core-bookmarks',
  version: '0.55.1',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:utils@0.55.1');
  api.use('unchained:core-logger@0.55.1');

  api.mainModule('bookmarks.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-bookmarks');
  api.mainModule('bookmarks-tests.js');
});
