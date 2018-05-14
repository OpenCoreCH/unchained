/* globals Package */
Package.describe({
  name: 'unchained:core-avatars',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.6.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory');
  api.use('dburles:collection-helpers');
  api.use('ostrio:files');

  api.use('unchained:utils');

  api.mainModule('avatars.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-avatars');
  api.mainModule('avatars-tests.js');
});
