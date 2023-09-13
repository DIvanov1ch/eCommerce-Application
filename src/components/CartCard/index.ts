import './cart-card.scss';
import html from './template.html';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { classSelector } from '../../utils/create-element';
import ProductCard from '../ProductCard';

const CssClasses = {
  COMPONENT: 'cart-card',
  NAME: 'cart-card__name',
  IMAGE: 'cart-card__image',
  PRICE: 'cart-card__price',
};

export default class CartCard extends ProductCard {
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

  protected render(): void {
    const { NAME } = CssClasses;

    if (!(this.#key in Store.products)) {
      super.showError();
      return;
    }

    const product = Store.products[this.#key];
    const {
      name: { [LANG]: name },
      masterVariant: { images, prices = [] },
    } = product;

    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    super.insertHtml(classSelector(NAME), name);
    super.insertImages(images);
    super.setPrice(price, discounted);
  }
}
