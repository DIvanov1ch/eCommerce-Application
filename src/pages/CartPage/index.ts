import { Cart, LineItem } from '@commercetools/platform-sdk';
import { createNewCart, getActiveCart } from '../../services/API';
import Router from '../../services/Router';
import Page from '../Page';
import html from './cart.html';
import './cart.scss';
import CustomerCart from '../../services/CustomerCart';
import CssClasses from './css-classes';
import { classSelector } from '../../utils/create-element';
import CartCard from '../../components/CartCard';
import Store from '../../services/Store';
import { setElementTextContent } from '../../utils/service-functions';
import PriceBox from '../../components/PriceBox';
import ClearDialog from '../../components/ClearDialog';

Router.registerRoute('cart', 'cart-page');

const HTML = {
  EMPTY: `<h3>Your Shopping Cart is empty</h3>
  <p>Looks like you have not added anything to your cart. You will find a lot of interesting products on our <a class="link" href="#catalog">Catalog</a> page.</p>`,
};

export default class CartPage extends Page {
  private cart: Cart = new CustomerCart();

  private updateCallback: (() => void) | undefined;

  private removeCallback: (() => void) | undefined;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.PAGE);
    this.loadCart();
    this.setCallback();
  }

  private loadCart(): void {
    getActiveCart()
      .then((body) => {
        this.saveCart(body);
        this.render();
      })
      .catch(() => {
        this.createCart();
      });
  }

  protected setCallback(): void {
    this.$(classSelector(CssClasses.CLEAR_BTN))?.addEventListener('click', CartPage.clearCart.bind(this));
    this.updateCallback = this.updateCart.bind(this);
    this.removeCallback = this.loadCart.bind(this);
    window.addEventListener('quantitychange', this.updateCallback);
    window.addEventListener('itemdelete', this.removeCallback);
  }

  private saveCart(cart: Cart): void {
    Store.customerCart = cart;
    this.cart = cart;
  }

  private updateCart(): void {
    const { customerCart } = Store;
    this.cart = customerCart || this.cart;
    this.setTotalPrice();
  }

  private render(): void {
    if (!this.cart.totalLineItemQuantity) {
      this.renderEmptyCart();
    } else {
      this.renderLineItems(this.cart.lineItems);
    }
    this.setTotalPrice();
  }

  private renderLineItems(lineItems: LineItem[]): void {
    const { CARTS, EMPTY_CART } = CssClasses;
    const carts = this.$(classSelector(CARTS));
    carts?.replaceChildren(...lineItems.map((lineItem: LineItem) => new CartCard(lineItem)));
    carts?.classList.remove(EMPTY_CART);

    this.enableButtons();
  }

  private renderEmptyCart(): void {
    const { CARTS, EMPTY_CART } = CssClasses;
    const carts = this.$(classSelector(CARTS));
    while (carts?.firstElementChild) {
      carts.firstElementChild.remove();
    }
    carts?.insertAdjacentHTML('afterbegin', HTML.EMPTY);
    carts?.classList.add(EMPTY_CART);

    this.disableButtons();
  }

  private createCart(): void {
    createNewCart()
      .then((body) => {
        this.saveCart(body);
        this.render();
      })
      .catch(console.error);
  }

  private static clearCart(): void {
    const modal = new ClearDialog();
    modal.show();
  }

  private setTotalPrice(): void {
    const { PRICE, SUMMARY } = CssClasses;
    const {
      totalPrice: { centAmount: totalPrice },
      totalLineItemQuantity,
    } = this.cart;
    const priceContainer = this.$(classSelector(PRICE));
    const priceBox = new PriceBox();
    priceBox.setPrice(totalPrice);
    priceContainer?.replaceChildren(priceBox);
    setElementTextContent(classSelector(SUMMARY), this, (totalLineItemQuantity || 0).toString());
  }

  private disableButtons(): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.add('disabledbutton'));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.add('notallowed'));
  }

  private enableButtons(): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.remove('disabledbutton'));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.remove('notallowed'));
  }

  private disconnectedCallback(): void {
    window.removeEventListener('quantitychange', this.updateCallback as () => void);
    window.removeEventListener('itemdelete', this.removeCallback as () => void);
  }
}
