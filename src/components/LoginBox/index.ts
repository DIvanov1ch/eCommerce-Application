import './login-box.scss';
import html from './login-box.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';

const CssClasses = {
  BOX: 'login-box',
  LOGIN: 'login-box__login',
  REGISTER: 'login-box__register',
  LOGOUT: 'login-box__logout',
};

export default class LoginBox extends BaseComponent {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.addEventListeners();
  }

  private addEventListeners(): void {
    window.addEventListener('userchange', () => this.handleLogInOut());
  }

  private handleLogInOut(): void {
    const { loggedIn } = Store.user;

    this.$$('li').forEach((item) => {
      const isHidden =
        (item.matches(`.${CssClasses.LOGOUT}`) && !loggedIn) || (!item.matches(`.${CssClasses.LOGOUT}`) && loggedIn);

      item.toggleAttribute('hidden', isHidden);
    });
  }
}
