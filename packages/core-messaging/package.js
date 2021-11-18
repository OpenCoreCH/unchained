Package.describe({
  name: 'unchained:core-messaging',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Messaging',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  mustache: '4.1.0',
  mjml: '4.8.1',
  'unchained-logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');

  api.use('unchained:core-worker@1.0.0-beta15');

  api.mainModule('messaging.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-messaging');
  api.mainModule('messaging-tests.js');
});
