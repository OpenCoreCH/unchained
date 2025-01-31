Package.describe({
  name: 'unchained:core-countries',
  version: '1.0.0-rc.12',
  summary: 'Unchained Engine Core: Countries',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'emoji-flags': '1.3.0',
  'i18n-iso-countries': '6.4.0',
  'lru-cache': '6.0.0',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.12');
  api.use('unchained:events@1.0.0-rc.12');

  api.mainModule('src/countries-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-rc.12');
  api.use('unchained:core-countries');

  api.mainModule('tests/countries-index.test.ts');
});
