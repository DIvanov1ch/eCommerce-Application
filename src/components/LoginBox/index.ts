import './login-box.scss';
import html from './login-box.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import { classSelector } from '../../utils/create-element';

const CssClasses = {
  BOX: 'login-box',
  LOGIN: 'login-box__login',
  REGISTER: 'login-box__register',
  LOGOUT: 'login-box__logout',
  PROFILE: 'login-box__profile',
  USER: 'login-box__user',
  CART: 'login-box__cart',
};

function getCartItemsCount(): number {
  const cart = Store.customerCart;
  if (!cart) {
    return 0;
  }
  return cart.lineItems.reduce((acc, item) => acc + item.quantity, 0);
}

export default class LoginBox extends BaseComponent {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.addEventListeners();
    this.updateState();
    this.setCartBadge();
  }

  private addEventListeners(): void {
    window.addEventListener('userchange', () => this.updateState());
    window.addEventListener('cartchange', () => this.setCartBadge());
  }

  private updateState(): void {
    const loggedIn = !!Store.customer;
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

  private setCartBadge(): void {
    const count = getCartItemsCount();
    const cartLink = this.$(`.${CssClasses.CART} a`);
    if (!cartLink) {
      return;
    }
    if (count === 0) {
      cartLink.removeAttribute('data-badge');
      return;
    }
    cartLink.dataset.badge = count.toString();
  }
}
