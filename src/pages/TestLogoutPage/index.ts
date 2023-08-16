import Store from '../../services/Store';
import Page from '../Page';
import html from './template.html';

export default class TestLogoutPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.$('button')?.addEventListener('click', () => {
      Store.user = { loggedIn: false };
    });
  }
}
