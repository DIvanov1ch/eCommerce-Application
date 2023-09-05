import { Image } from '@commercetools/platform-sdk';
import './product-card.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { className, createElement } from '../../utils/create-element';
import PriceBox from '../PriceBox';

const CssClasses = {
  COMPONENT: 'product-card',
  NAME: 'product-card__name',
  DESCRIPTION: 'product-card__description',
  IMAGE: 'product-card__image',
  PRICE: 'product-card__price',
};

export default class ProductCard extends BaseComponent {
  #key = '';

  constructor(key = '') {
    super(html);
    this.#key = key;
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.render();
    this.addEventListener('click', () => {
      window.location.href = `#product/${this.#key}`;
    });
  }

  private render(): void {
    const { NAME, DESCRIPTION } = CssClasses;

    if (!(this.#key in Store.products)) {
      this.showError();
      return;
    }

    const product = Store.products[this.#key];
    const {
      name: { [LANG]: name },
      description: { [LANG]: description } = {},
      masterVariant: { images, prices = [] },
    } = product;

    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    this.insertHtml(className(NAME), name);
    this.insertHtml(className(DESCRIPTION), description.split('\n')[0]);
    this.insertImages(images);
    this.setPrice(price, discounted);
  }

  private setPrice(price: number, discounted: number): void {
    const priceContainer = this.$(className(CssClasses.PRICE));
    const priceBox = new PriceBox();
    priceBox.setPrice(price);
    priceBox.setDiscounted(discounted);

    priceContainer?.replaceChildren(priceBox);
  }

  private insertImages(images?: Image[]): void {
    if (!images || !images.length) {
      return;
    }

    const [{ url }] = images;
    const image = createElement('img', { src: url });

    this.$(className(CssClasses.IMAGE))?.replaceChildren(image);
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'key') {
      this.#key = newValue;
      this.render();
    }
  }

  private static get observedAttributes(): string[] {
    return ['key'];
  }

  private showError(): void {
    this.replaceChildren('Loading...');
  }
}
