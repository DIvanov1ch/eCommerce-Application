import Page from '../Page';
import html from './template.html';
import Store from '../../services/Store';

export default class TestLoginPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.$('button')?.addEventListener('click', () => {
      Store.user = { loggedIn: true };
    });
  }
}
