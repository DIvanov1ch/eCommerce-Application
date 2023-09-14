import { Cart, LineItem } from '@commercetools/platform-sdk';
import { createNewCart, getActiveCart /* , getCartByCustomerId */ } from '../../services/API';
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
        this.showResponseError();
      });
  }

  protected setCallback(): void {
    this.updateCallback = this.updateCart.bind(this);
    this.removeCallback = this.loadCart.bind(this);
    window.addEventListener('updateTotalCost', this.updateCallback);
    window.addEventListener('removeLineItem', this.removeCallback);
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
  }

  private showResponseError(): void {
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

  private disconnectedCallback(): void {
    window.removeEventListener('updateTotalCost', this.updateCallback as () => void);
    window.removeEventListener('removeLineItem', this.removeCallback as () => void);
  }
}
