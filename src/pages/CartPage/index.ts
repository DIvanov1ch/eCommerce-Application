import { Cart, LineItem } from '@commercetools/platform-sdk';
import { getActiveCart, getCartByCustomerId } from '../../services/API';
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

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.PAGE);
    this.loadCart();
  }

  private loadCart(): void {
    if (Store.customer) {
      const customerId = Store.customer.id;
      getCartByCustomerId(customerId)
        .then((body) => {
          console.log('cartById', body);
          this.saveCart(body);
          this.render();
        })
        .catch(() => {
          this.showResponseError();
        });
    } else {
      getActiveCart()
        .then(({ body }) => {
          console.log('activeCart', body);
          this.saveCart(body);
          this.render();
        })
        .catch(() => {
          this.showResponseError();
        });
    }
  }

  private saveCart(cart: Cart): void {
    Store.customerCart = cart;
    this.cart = cart;
  }

  private render(): void {
    this.renderLineItems(this.cart.lineItems);
    this.setTotalPrice();
  }

  private renderLineItems(products: LineItem[]): void {
    this.$(classSelector(CssClasses.CARTS))?.replaceChildren(
      ...products.map((product: LineItem) => new CartCard(product.productKey))
    );
  }

  private showResponseError(): void {
    this.clearCartContainer('<p>An active cart does not exist.</p>');
  }

  private clearCartContainer(innerHTML = ''): void {
    this.insertHtml(classSelector(CssClasses.CARTS), innerHTML);
  }

  private setTotalPrice(): void {
    const { PRICE, SUMMARY } = CssClasses;
    const {
      totalPrice: { centAmount: totalPrice },
      lineItems: { length: summary },
    } = this.cart;
    const priceContainer = this.$(classSelector(PRICE));
    const priceBox = new PriceBox();
    priceBox.setPrice(totalPrice);
    priceContainer?.replaceChildren(priceBox);
    setElementTextContent(classSelector(SUMMARY), this, summary.toString());
  }
}
