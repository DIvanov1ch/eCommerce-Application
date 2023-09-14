import './variants.scss';
import { AttributeDefinition, ProductProjection, ProductVariant } from '@commercetools/platform-sdk';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import { loadProductTypes } from '../../utils/load-data';
import throwError from '../../utils/throw-error';
import { createElement } from '../../utils/create-element';
import { LANG } from '../../config';
import putProductIntoCart from '../../utils/put-product-into-cart';

const CssClasses = {
  COMPONENT: 'product-variants',
  LIST: 'attribute-list',
  ATTRIBUTE: 'attribute',
  SINGLE: 'attribute--single',
  LABEL: 'attribute__label',
  VALUES: 'attribute__values',
  OPTIONS: 'attribute__options',
  OPTION: 'attribute__option',
  ADD_TO_CART: 'button button--cart',
};

const MAX_LENGTH = 20;

const ERRORS = {
  LOADING: 'Error loading types...',
};

const CONSTRAINT = {
  SAME_FOR_ALL: 'SameForAll',
  COMBINATION_UNIQUE: 'CombinationUnique',
};

const ADD_TO_CART = 'Add to cart';

type Attribute = {
  order: number;
  name: string;
  label: string;
  values: string[];
};

const select = (name: string, values: string[]): HTMLSelectElement => {
  const selectElement = createElement('select', { name });
  const options = values.map((value) => new Option(value, value));
  selectElement.append(...options);
  return selectElement;
};

const radios = (name: string, values: string[]): HTMLElement[] => {
  return values.map((value, i) => {
    const rbx = createElement('input', { name, value, type: 'radio' });
    rbx.checked = !i;
    return createElement('label', { className: CssClasses.OPTION }, rbx, createElement('span', null, value));
  });
};

const renderValues = (name: string, values: string[]): HTMLElement => {
  const container = createElement('div', { className: CssClasses.OPTIONS });
  const strValues = values.join('');
  if (values.length === 1) {
    container.append(createElement('span', null, strValues));
  } else if (strValues.length > MAX_LENGTH) {
    container.append(select(name, values));
  } else {
    container.append(...radios(name, values));
  }

  return container;
};

export default class ProductVariants extends BaseComponent {
  #key = '';

  #product: ProductProjection;

  #attributes: AttributeDefinition[] = [];

  #variants: ProductVariant[] = [];

  #selectedVariantId = 1;

  #selectedAttributes: Record<string, string> = {};

  #form: HTMLFormElement;

  #btnCart: HTMLButtonElement;

  constructor(key = '') {
    super(html);
    this.#key = key;
    this.#product = Store.products[this.#key];

    this.#form = createElement('form', null);
    this.#btnCart = createElement('button', { type: 'submit', className: CssClasses.ADD_TO_CART }, ADD_TO_CART);
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleAddToCart().catch(throwError);
    });
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.render().catch(throwError);
    this.addEventListener('change', this.handleVariantChange.bind(this));
  }

  private async prepareData(): Promise<boolean> {
    if (!Store.types.length) {
      await loadProductTypes();
    }

    this.toggleLoading(false);

    if (!Store.types.length) {
      this.showError(ERRORS.LOADING);
      return false;
    }

    const product = this.#product;
    const {
      masterVariant,
      variants,
      productType: { id: typeId },
    } = product;

    this.#selectedAttributes = Object.fromEntries(
      (masterVariant.attributes || []).map(({ name, value }) => [name, value])
    );

    const type = Store.types.find(({ id }) => id === typeId);
    if (!type) {
      this.showError(ERRORS.LOADING);
    }

    this.#attributes = (type?.attributes || []).sort();
    this.#variants = [masterVariant, ...variants];

    return true;
  }

  private async render(): Promise<void> {
    if (!(await this.prepareData())) {
      return;
    }

    const { ATTRIBUTE, SINGLE, LABEL, LIST } = CssClasses;

    const displayAttributes: Attribute[] = this.#attributes
      .map(({ name, label: { [LANG]: label }, attributeConstraint }) => {
        const allValues = this.#variants
          .flatMap(({ attributes = [] }) => attributes.filter((attr) => attr.name === name))
          .map((attr) => String(attr.value));
        const values = [...new Set(allValues)];
        const order = (attributeConstraint === CONSTRAINT.SAME_FOR_ALL ? 0 : 1) + values.length;
        return { name, order, label, values };
      })
      .filter(({ values }) => values.length);
    displayAttributes.sort(({ order: a }, { order: b }) => a - b);

    const renderAttribute = ({ name, label, values }: Attribute): HTMLLIElement => {
      const li = createElement('li', { className: ATTRIBUTE });
      li.classList.toggle(SINGLE, values.length === 1);
      li.append(createElement('strong', { className: LABEL }, label));
      li.append(renderValues(name, values));
      return li;
    };

    const list = createElement('ul', { className: LIST }, ...displayAttributes.map(renderAttribute));
    this.#form.append(list, this.#btnCart);

    this.replaceChildren(this.#form);
  }

  private showError(text: string): void {
    this.replaceChildren(text);
  }

  private handleVariantChange(event: Event): void {
    const { target: input } = event;
    if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) {
      return;
    }

    const { value: attrValue, name: attrName } = input;
    this.#selectedAttributes[attrName] = attrValue;

    const selectedVariant = this.#variants.find(
      (variant) => variant.attributes?.every(({ name, value }) => this.#selectedAttributes[name] === value)
    );

    if (selectedVariant) {
      this.#selectedVariantId = selectedVariant.id;
    }
  }

  private async handleAddToCart(): Promise<void> {
    this.#btnCart.disabled = true;
    const { key } = this.#product;

    await putProductIntoCart(String(key), this.#selectedVariantId);
    this.#btnCart.disabled = false;
  }
}
