import './home.scss';
import html from './home.html';
import Page from '../Page';

export default class HomePage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
