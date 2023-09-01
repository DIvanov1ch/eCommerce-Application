import './code.scss';
import html from './template.html';
import Page from '../Page';
import Router from '../../services/Router';

Router.registerRoute('components', 'components-page');

const PAGE_TITLE = 'Components';

export default class ComponentsPage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
