Package.describe({
  name: 'unchained:core-users',
  version: '0.53.1',
  summary: 'Unchained Engine Core: Users',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  uuid: '7.0.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('percolate:migrations@1.0.2');
  api.use('unchained:utils@0.53.1');
  api.use('unchained:core-accountsjs@0.53.1');
  api.use('unchained:core-logger@0.53.1');
  api.use('unchained:core-languages@0.53.1');
  api.use('unchained:core-countries@0.53.1');
  api.use('unchained:core-files@0.53.1');

  api.mainModule('users.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-users');
  api.mainModule('users-tests.js');
});
