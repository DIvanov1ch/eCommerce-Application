import { LineItem, Image } from '@commercetools/platform-sdk';
import './cart-card.scss';
import html from './template.html';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { classSelector, createElement } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import PriceBox from '../PriceBox';

const CssClasses = {
  CART: 'cart-card',
  NAME: 'cart-card__name',
  IMAGE: 'cart-card__image',
  PRICE: 'cart-card__price',
};

export default class CartCard extends BaseComponent {
  #key = '';

  constructor(key = '') {
    super(html);
    this.#key = key;
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.CART);
    this.render();
    this.setCallback();
  }

  protected render(): void {
    const { NAME } = CssClasses;

    if (!Store.customerCart) {
      this.showError();
      return;
    }

    const products: LineItem[] = Store.customerCart.lineItems;
    const product = products.find((item) => item.productKey === this.#key) as LineItem;
    const {
      name: { [LANG]: name },
      variant: { images, prices = [] },
    } = product;

    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    this.insertHtml(classSelector(NAME), name);
    this.insertImages(images);
    this.setPrice(price, discounted);
  }

  private setCallback(): void {
    const image = <HTMLDivElement>this.$(classSelector(CssClasses.IMAGE));
    const name = <HTMLDivElement>this.$(classSelector(CssClasses.NAME));
    [image, name].forEach((el) =>
      el.addEventListener('click', () => {
        window.location.href = `#product/${this.#key}`;
      })
    );
  }

  protected insertImages(images?: Image[]): void {
    if (!images || !images.length) {
      return;
    }

    const [{ url }] = images;
    const image = createElement('img', { src: url });

    this.$(classSelector(CssClasses.IMAGE))?.replaceChildren(image);
  }

  protected setPrice(price: number, discounted: number): void {
    const priceContainer = this.$(classSelector(CssClasses.PRICE));
    const priceBox = new PriceBox();
    priceBox.setPrice(price);
    priceBox.setDiscounted(discounted);

    priceContainer?.replaceChildren(priceBox);
  }

  protected attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'key') {
      this.#key = newValue;
      this.render();
    }
  }

  protected static get observedAttributes(): string[] {
    return ['key'];
  }

  protected showError(): void {
    this.replaceChildren('Loading...');
  }
}
