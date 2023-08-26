import './styles.scss';
import Page from '../Page';
import html from './template.html';
import Store from '../../services/Store';
import { pause } from '../../utils/create-element';

const REDIRECT_DELAY = 5000;
const LOGGING_IN_TEXT = 'Logging in...';
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const SUCCESS_HTML = `
<p>Success, you will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`;

function redirectToMain(): void {
  window.location.assign('#');
}

export default class TestLoginPage extends Page {
  private button!: HTMLButtonElement | null;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    if (Store.user.loggedIn) {
      redirectToMain();
    }

    this.button = this.$<'button'>('button');
    this.button?.addEventListener('click', () => {
      this.logIn().catch(console.error);
    });
  }

  private async logIn(): Promise<void> {
    if (!this.button) {
      return;
    }

    this.button.disabled = true;
    this.button.innerText = LOGGING_IN_TEXT;

    await pause(1000);
    Store.user = { loggedIn: true };
    this.innerHTML = SUCCESS_HTML;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      redirectToMain();
    }
  }
}
