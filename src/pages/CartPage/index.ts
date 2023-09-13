import { Cart, LineItem } from '@commercetools/platform-sdk';
import { getCart } from '../../services/API';
import Router from '../../services/Router';
import Page from '../Page';
import html from './cart.html';
import './cart.scss';
import CustomerCart from '../../services/CustomerCart';
import CssClasses from './css-classes';
import { classSelector } from '../../utils/create-element';
import CartCard from '../../components/CartCard';

Router.registerRoute('cart', 'cart-page');

export default class CartPage extends Page {
  private cart: Cart = new CustomerCart();

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.PAGE);
    this.loadCart();
  }

  private loadCart(): void {
    getCart()
      .then((body) => {
        this.cart = body;
        this.render(body.lineItems);
      })
      .catch(() => {
        this.renderEmpty();
      });
  }

  private render(products: LineItem[]): void {
    this.$(classSelector(CssClasses.CARTS_WRAPPER))?.replaceChildren(
      ...products.map((product: LineItem) => new CartCard(product.key))
    );
  }

  private renderEmpty(): void {
    this.clearCartContainer('<p>An active cart does not exist.</p>');
  }

  private clearCartContainer(innerHTML = ''): void {
    this.insertHtml(classSelector(CssClasses.CARTS_WRAPPER), innerHTML);
  }
}
