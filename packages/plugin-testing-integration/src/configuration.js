let configuration = {
  appMainPath: 'app/main.js',
  rootDir: process.cwd(),
  masterElementId: 'page',
  protocol: 'https:',
  host: 'imajs.io',
  environment: 'test',
  locale: 'en',
  TestPageRenderer: null,
  initSettings: () => {},
  initBindApp: () => {},
  initServicesApp: () => {},
  initRoutes: () => {},
  extendAppObject: () => {},
  prebootScript: () => Promise.resolve(),
};

/**
 * @returns {object} configuration
 */
export function getConfig() {
  return configuration;
}

/**
 * Sets config keys
 *
 * @param {object} config
 */
export function setConfig(config) {
  Object.assign(configuration, config);
}
