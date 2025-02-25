// @FIXME Update import from @ima/cli once it exports resolveImaConfig function
import { resolveImaConfig } from '@ima/cli/dist/webpack/utils';
import {
  createImaApp,
  getClientBootConfig,
  onLoad,
  bootClientApp,
} from '@ima/core';
import { assignRecursively } from '@ima/helpers';
import { JSDOM } from 'jsdom';

import { unAopAll } from './aop';
import { getBootConfigExtensions } from './bootConfigExtensions';
import { getConfig } from './configuration';
import { requireFromProject } from './helpers';
import { generateDictionary } from './localization';

const setIntervalNative = global.setInterval;
const setTimeoutNative = global.setTimeout;
const setImmediateNative = global.setImmediate;

let timers = [];

/**
 * Clears IMA Application instance from environment
 *
 * @param {object} app Object from initImaApp method
 */
function clearImaApp(app) {
  global.setInterval = setIntervalNative;
  global.setTimeout = setTimeoutNative;
  global.setImmediate = setImmediateNative;
  timers.forEach(({ clear }) => clear());
  unAopAll();
  app.oc.clear();
}

/**
 * Initializes IMA application with our production-like configuration
 * Reinitializes jsdom with configuration, that will work with our application
 *
 * @param {object} [bootConfigMethods] Object, that can contain methods for ima boot configuration
 * @returns {Promise<object>}
 */
async function initImaApp(bootConfigMethods = {}) {
  const config = getConfig();
  const bootConfigExtensions = getBootConfigExtensions();
  const imaConfig = await resolveImaConfig({ rootDir: config.rootDir });

  // JSDom needs to be initialized before we start importing project files,
  // since some packages can do some client/server detection at this point
  _initJSDom();
  _installTimerWrappers();

  await config.prebootScript();

  const defaultBootConfigMethods = requireFromProject(
    config.appMainPath
  ).getInitialAppConfigFunctions();

  /**
   * Initializes JSDOM environment for the application run
   */
  function _initJSDom() {
    /**
     * Copies object props from src to target
     *
     * @param {object} src
     * @param {object} target
     */
    function copyProps(src, target) {
      Object.defineProperties(target, {
        ...Object.getOwnPropertyDescriptors(src),
        ...Object.getOwnPropertyDescriptors(target),
      });
    }

    const jsdom = new JSDOM(
      `<!doctype html><html><body><div id="${config.masterElementId}"></div></body></html>`,
      {
        pretendToBeVisual: true,
        url: `${config.protocol}//${config.host}/`,
      }
    );
    const { window } = jsdom;

    global.window = window;
    global.document = window.document;
    global.navigator = {
      userAgent: 'node.js',
    };
    copyProps(window, global);
    global.jsdom = jsdom;
    global.$IMA = global.$IMA || {};
    global.window.$IMA = global.$IMA;
    global.window.$Debug = global.$Debug;
    global.window.scrollTo = () => {};
    global.window.fetch = global.fetch;

    global.$IMA.$Protocol = config.protocol;
    global.$IMA.$Host = config.host;
    global.$IMA.$Env = config.environment;
    global.$IMA.$App = config.$App || {};
    global.$IMA.i18n = generateDictionary(imaConfig.languages, config.locale);
  }

  /**
   * Wraps the global timer methods to collect their return values,
   * which can be later cleared in clearImaApp function
   */
  function _installTimerWrappers() {
    global.setInterval = (...args) => {
      let timer = setIntervalNative(...args);

      timers.push({ timer, clear: () => global.clearInterval(timer) });

      return timer;
    };
    global.setTimeout = (...args) => {
      let timer = setTimeoutNative(...args);

      timers.push({ timer, clear: () => global.clearTimeout(timer) });

      return timer;
    };
    global.setImmediate = (...args) => {
      let timer = setImmediateNative(...args);

      timers.push({ timer, clear: () => global.clearImmediate(timer) });

      return timer;
    };
  }

  /**
   * @param {string} method
   * @returns {Function} Function merging bootConfigMethods from param
   * and web default boot config methods
   */
  function _getBootConfigForMethod(method) {
    return (...args) => {
      const results = [];
      results.push(defaultBootConfigMethods[method](...args) || {});
      results.push(bootConfigExtensions[method](...args) || {});

      if (typeof bootConfigMethods[method] === 'function') {
        results.push(bootConfigMethods[method](...args) || {});
      }

      return assignRecursively({}, ...results);
    };
  }

  let app = createImaApp();
  let bootConfig = getClientBootConfig({
    initSettings: _getBootConfigForMethod('initSettings'),
    initBindApp: _getBootConfigForMethod('initBindApp'),
    initServicesApp: _getBootConfigForMethod('initServicesApp'),
    initRoutes: _getBootConfigForMethod('initRoutes'),
  });
  await onLoad();
  bootClientApp(app, bootConfig);

  // To use ima route handler in jsdom
  app.oc.get('$Router').listen();

  return Object.assign({}, app, bootConfigExtensions.getAppExtension(app));
}

export { initImaApp, clearImaApp };
