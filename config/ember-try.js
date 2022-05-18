'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary'),
  ]).then(() => {
    return {
      useYarn: true,
      scenarios: [
        {
          name: 'ember-lts-2.12',
          npm: {
            devDependencies: {
              'ember-source': '~2.12.0',
            },
          },
        },
        {
          name: 'ember-lts-2.16',
          npm: {
            devDependencies: {
              'ember-source': '~2.16.0',
            },
          },
        },
        {
          name: 'ember-lts-2.18',
          npm: {
            devDependencies: {
              'ember-source': '~2.18.0',
            },
          },
        },
        {
          name: 'ember-3.1',
          npm: {
            devDependencies: {
              'ember-source': '~3.1.0',
            },
          },
        },
        {
          name: 'ember-3.2',
          npm: {
            devDependencies: {
              'ember-source': '~3.2.0',
            },
          },
        },
        {
          name: 'ember-3.3',
          npm: {
            devDependencies: {
              'ember-source': '~3.3.0',
            },
          },
        },
        {
          name: 'ember-lts-3.4',
          npm: {
            devDependencies: {
              'ember-source': '~3.4.0',
            },
          },
        },
        {
          name: 'ember-lts-3.8',
          npm: {
            devDependencies: {
              'ember-source': '~3.8.0',
            },
          },
        },
        {
          name: 'ember-lts-3.28',
          npm: {
            devDependencies: {
              'ember-source': '~3.28.0',
            },
          },
        },
        {
          name: 'ember-default',
          npm: {
            devDependencies: {},
          },
        },
      ],
    };
  });
};
