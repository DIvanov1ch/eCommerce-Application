import './styles.scss';
import Page from '../Page';
import html from './template.html';
import Store from '../../services/Store';
import { pause } from '../../utils';

const REDIRECT_DELAY = 5000;
const LOGGING_OUT_TEXT = 'Logging out...';
const TIMEOUT = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const SUCCESS_HTML = `
<p>Success, you will be redirected to <a href="#">main page</a> in ${TIMEOUT} sec...</p>`;

function redirectToMain(): void {
  window.location.assign('#');
}

export default class LogoutPage extends Page {
  private button!: HTMLButtonElement | null;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    if (!Store.user.loggedIn) {
      redirectToMain();
    }

    this.button = this.$<'button'>('button');
    this.button?.addEventListener('click', () => {
      this.logOut().catch(console.error);
    });
  }

  private async logOut(): Promise<void> {
    if (!this.button) {
      return;
    }

    this.button.disabled = true;
    this.button.innerText = LOGGING_OUT_TEXT;

    await pause(1000);
    Store.user = { loggedIn: false };
    this.innerHTML = SUCCESS_HTML;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      redirectToMain();
    }
  }
}