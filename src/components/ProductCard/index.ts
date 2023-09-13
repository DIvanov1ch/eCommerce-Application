import { Image } from '@commercetools/platform-sdk';
import './product-card.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { classSelector, createElement } from '../../utils/create-element';
import PriceBox from '../PriceBox';
import { putProductIntoCart } from '../../services/API';
import throwError from '../../utils/throw-error';
import { createLoader, deleteLoader } from '../../utils/loader';

const CssClasses = {
  COMPONENT: 'product-card',
  NAME: 'product-card__name',
  DESCRIPTION: 'product-card__description',
  IMAGE: 'product-card__image',
  PRICE: 'product-card__price',
  CART: 'product-card__cart',
  CARTICON: 'product-card__cart-svg-icon',
  CARTICONINACTIVE: 'product-card__cart-svg-icon--inactive',
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

    this.insertHtml(classSelector(NAME), name);
    this.insertHtml(classSelector(DESCRIPTION), description.split('\n')[0]);
    this.insertImages(images);
    this.setPrice(price, discounted);
    this.setCartIcon(this.#key);
    this.CartIconClickHandling(this.#key);
  }

  private setPrice(price: number, discounted: number): void {
    const priceContainer = this.$(classSelector(CssClasses.PRICE));
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

    this.$(classSelector(CssClasses.IMAGE))?.replaceChildren(image);
  }

  private setCartIcon(key: string): void {
    Store.cart.forEach((el) => {
      if (key === el) {
        this.$(classSelector(CssClasses.CARTICON))?.classList.add(`${CssClasses.CARTICONINACTIVE}`);
      }
    });
  }

  private CartIconClickHandling(productKey: string): void {
    this.$(classSelector(CssClasses.CARTICON))?.addEventListener('click', (event) => {
      createLoader();
      putProductIntoCart(productKey)
        .then(() => {
          Store.cart.push(productKey);
          this.$(classSelector(CssClasses.CARTICON))?.classList.add(`${CssClasses.CARTICONINACTIVE}`);
          deleteLoader();
        })
        .catch(() => throwError);
      event.stopPropagation();
    });
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
