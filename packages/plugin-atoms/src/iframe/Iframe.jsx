import { PageContext } from '@ima/react-page-renderer';
import { PureComponent } from 'react';

import AmpIframe from './AmpIframe';
import HtmlIframe from './HtmlIframe';

/**
 * Common iframe
 *
 * @namespace ima.ui.atom.iframe
 * @module ima.ui.atom
 */
export default class Iframe extends PureComponent {
  static get contextType() {
    return PageContext;
  }

  static get defaultProps() {
    return {
      src: null,
      srcDoc: null,
      width: null,
      height: null,
      scrolling: 'no',
      layout: null,
      sandbox: null,
      allow: null,
      allowFullScreen: null,
      resizable: false,
      frameBorder: '0',
      noloading: false,
      className: '',
      onLoad: null,
      'data-e2e': null,
      marginWidth: null,
      marginHeight: null,
    };
  }

  render() {
    if (this.context.$Utils.$UIComponentHelper.isAmp()) {
      return <AmpIframe {...this.props} />;
    } else {
      return <HtmlIframe {...this.props} />;
    }
  }
}
