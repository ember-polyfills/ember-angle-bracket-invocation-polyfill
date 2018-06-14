const report_file = process.env.BUILD_STAGINGDIRECTORY
  ? process.env.BUILD_STAGINGDIRECTORY + '/test-results/results.xml'
  : 'test-results.xml';

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: ['Chrome'],
  launch_in_dev: ['Chrome'],
  xunit_intermediate_output: true,
  reporter: 'xunit',
  report_file,
  browser_args: {
    Chrome: {
      mode: 'ci',
      args: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.TRAVIS ? '--no-sandbox' : null,

        '--disable-gpu',
        '--headless',
        '--remote-debugging-port=0',
        '--window-size=1440,900',
      ].filter(Boolean),
    },
  },
};
