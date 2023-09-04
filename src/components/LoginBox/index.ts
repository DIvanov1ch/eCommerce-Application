import './login-box.scss';
import html from './login-box.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';

const CssClasses = {
  BOX: 'login-box',
  LOGIN: 'login-box__login',
  REGISTER: 'login-box__register',
  LOGOUT: 'login-box__logout',
  PROFILE: 'login-box__profile',
  USER: 'login-box__user',
};

const classSelector = (name: string): string => `.${name}`;

export default class LoginBox extends BaseComponent {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.addEventListeners();
    this.updateState();
  }

  private addEventListeners(): void {
    window.addEventListener('userchange', () => this.updateState());
  }

  private updateState(): void {
    const { loggedIn } = Store.user;
    const { LOGOUT, LOGIN, REGISTER, PROFILE } = CssClasses;

    this.toggleItems([LOGIN, REGISTER], loggedIn);
    this.toggleItems([LOGOUT, PROFILE], !loggedIn);
  }

  private toggleItems(classNames: string[], isHidden: boolean): void {
    const selector = classNames.map(classSelector).join(', ');
    this.$$(selector).forEach((item) => {
      item.toggleAttribute('hidden', isHidden);
    });
  }
}
