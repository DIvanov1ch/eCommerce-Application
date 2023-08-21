import './login-box.scss';
import html from './login-box.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';

const CssClasses = {
  BOX: 'login-box',
  LOGIN: 'login-box__login',
  REGISTER: 'login-box__register',
  LOGOUT: 'login-box__logout',
  USER: 'login-box__user',
};

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
    const { loggedIn, firstName, lastName } = Store.user;
    const fullName = [firstName, lastName].filter((e) => e).join(' ');

    this.$$('li').forEach((item) => {
      const isHidden =
        (item.matches(`.${CssClasses.LOGOUT}`) && !loggedIn) || (!item.matches(`.${CssClasses.LOGOUT}`) && loggedIn);

      item.toggleAttribute('hidden', isHidden);
    });

    const userField = this.$(`.${CssClasses.USER}`);
    if (userField) {
      userField.innerText = fullName;
    }
  }
}
