import './error.scss';
import html from './error.html';
import Page from '../Page';

const PAGE_TITLE = 'Error';

export default class ErrorPage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
