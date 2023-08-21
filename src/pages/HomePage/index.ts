import './home.scss';
import html from './home.html';
import Page from '../Page';

const PAGE_TITLE = 'Home';

export default class HomePage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
