import './price-box.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import { createElement } from '../../utils/create-element';
import { ElementChild } from '../../types/elements';

const CssClasses = {
  COMPONENT: 'price-box',
  DISCOUNT: 'price-box__discount',
  PRICE: 'price-box__price',
  OLD: 'price-box__price--old',
  DISCOUNTED: 'price-box__price--discounted',
  CURRENT: 'price-box__price--current',
  SYMBOL: 'price-box__symbol',
  WHOLE: 'price-box__whole',
  DELIMITER: 'price-box__delimiter',
  FRACTION: 'price-box__fraction',
};

const PRICE_SIGN = '$';
const PRICE_DELIMITER = '.';

const span = (className: string, ...children: ElementChild[]): HTMLSpanElement =>
  createElement('span', { className }, ...children);

const priceElement = (centsAmount: number, priceClass = ''): HTMLElement => {
  const { PRICE, SYMBOL, WHOLE, DELIMITER, FRACTION } = CssClasses;
  const [whole, fraction] = (centsAmount / 100).toFixed(2).split('.');

  return span(
    [PRICE, priceClass].join(' '),
    span(SYMBOL, PRICE_SIGN),
    span(WHOLE, whole),
    span(DELIMITER, PRICE_DELIMITER),
    span(FRACTION, fraction)
  );
};

export default class PriceBox extends BaseComponent {
  #price = 0;

  #discounted = 0;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
  }

  private render(): void {
    const { DISCOUNT, DISCOUNTED, OLD, CURRENT } = CssClasses;
    const isDiscounted = !!this.#discounted;
    const elements = [];
    const discounted = this.#discounted;
    const price = this.#price;

    if (isDiscounted) {
      const discount = ((1 - discounted / price) * 100).toFixed(0);
      elements.push(span(DISCOUNT, `%${discount}`), priceElement(discounted, DISCOUNTED), priceElement(price, OLD));
    } else {
      elements.push(priceElement(price, CURRENT));
    }

    this.replaceChildren(...elements);
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'price') {
      this.setPrice(newValue);
    }

    if (name === 'discounted') {
      this.setDiscounted(newValue);
    }
  }

  private static get observedAttributes(): string[] {
    return ['price', 'discounted'];
  }

  public setPrice(price: string | number): void {
    this.#price = +price;
    this.render();
  }

  public setDiscounted(price: string | number): void {
    this.#discounted = +price;
    this.render();
  }
}
