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
    getCart()
      .then((body) => {
        console.log(body);
        Store.customerCart = body;
        this.cart = body;
        this.render(body.lineItems);
        this.setTotal();
      })
      .catch(() => {
        this.renderEmpty();
      });
  }

  private render(products: LineItem[]): void {
    this.$(classSelector(CssClasses.CARTS))?.replaceChildren(
      ...products.map((product: LineItem) => new CartCard(product.productKey))
    );
  }

  private renderEmpty(): void {
    this.clearCartContainer('<p>An active cart does not exist.</p>');
  }

  private clearCartContainer(innerHTML = ''): void {
    this.insertHtml(classSelector(CssClasses.CARTS), innerHTML);
  }

  private setTotal(): void {
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
