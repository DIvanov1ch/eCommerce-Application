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
    this.renderLineItems(this.cart.lineItems);
    this.setTotalPrice();
  }

  private renderLineItems(lineItems: LineItem[]): void {
    this.$(classSelector(CssClasses.CARTS))?.replaceChildren(
      ...lineItems.map((lineItem: LineItem) => new CartCard(lineItem))
    );
    if (!this.cart.totalLineItemQuantity) {
      this.displayMessageForEmptyCart();
      this.disableButtons();
      return;
    }
    this.enableButtons();
  }

  private createCart(): void {
    createNewCart()
      .then((body) => {
        this.saveCart(body);
        this.render();
      })
      .catch(console.error);
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

  private displayMessageForEmptyCart(): void {
    this.$(classSelector(CssClasses.CARTS))?.insertAdjacentHTML('afterbegin', HTML.EMPTY);
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
