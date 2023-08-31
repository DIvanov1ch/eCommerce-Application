import './home.scss';
import html from './home.html';
import Page from '../Page';
import Router from '../../services/Router';

Router.registerRoute('', 'home-page');

const PAGE_TITLE = 'Home';

export default class HomePage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
