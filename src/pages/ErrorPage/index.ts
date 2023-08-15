import './error.scss';
import html from './error.html';
import Page from '../Page';

export default class ErrorPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
