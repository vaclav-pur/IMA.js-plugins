import path from 'path';

import MessageFormat from '@messageformat/core';
import globby from 'globby';

import { requireFromProject } from './helpers';

/**
 * Generates IMA formatted dictionary
 *
 * @param {object} languages
 * @param {string} locale
 * @returns {object}
 */
function generateDictionary(languages, locale = 'en') {
  if (!languages) {
    return {};
  }
  const mf = new MessageFormat(locale);
  const dictionaries = {};
  const langFileGlobs = languages[locale];
  globby.sync(langFileGlobs).forEach(file => {
    try {
      const filename = path
        .basename(file)
        .replace(locale.toUpperCase() + path.extname(file), '');

      const dictJson = requireFromProject(file);
      const dict = {};
      Object.keys(dictJson).forEach(key => {
        const message = dictJson[key];
        dict[key] = mf.compile(message);
      });

      dictionaries[filename] = dict;
    } catch (e) {
      console.error(
        `Tried to load dictionary JSON at path "${file}", but recieved following error.`
      );
      console.error(e);
    }
  });
  return dictionaries;
}

export { generateDictionary };
