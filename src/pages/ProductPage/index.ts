import { ProductProjection, Image } from '@commercetools/platform-sdk';
import './product.scss';
import html from './product.html';
import Page from '../Page';
import Router from '../../services/Router';
import { getProductProjectionByKey } from '../../services/API';
import { LANG } from '../../config';
import { createElement } from '../../utils/create-element';
import throwError from '../../utils/throw-error';

Router.registerRoute('product', 'product-page');

const PAGE_TITLE = 'Product details';

const CssClasses = {
  COMPONENT: 'product',
  NAME: 'product__name',
  DESCRIPTION: 'product__description',
  IMAGES: 'product__images',
  PARAMS: 'product__params',
};

const className = (name: string): string => `.${name}`;

export default class ProductPage extends Page {
  #params = '';

  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.#params = this.getAttribute('params') || '';

    if (!this.#params) {
      Router.errorPage();
    }

    this.toggleLoading();
    this.loadProduct().catch(throwError);
  }

  private async loadProduct(): Promise<void> {
    let product;
    try {
      product = await getProductProjectionByKey(this.#params);
    } catch (e) {
      Router.errorPage();
    }

    this.toggleLoading(false);
    if (product) {
      this.renderProduct(product);
    }

    this.insertHtml(className(CssClasses.PARAMS), JSON.stringify(product, null, 2));
  }

  private renderProduct(product: ProductProjection): void {
    const {
      name: { [LANG]: name },
      description: { [LANG]: description } = {},
      masterVariant: { images },
      categories,
    } = product;
    const { id: categoryId = '' } = categories.pop() || {};

    this.setCategoryId(categoryId);

    const { NAME, DESCRIPTION } = CssClasses;

    this.insertHtml(className(NAME), name);
    this.insertHtml(className(DESCRIPTION), description);

    if (images) {
      this.insertImages(images);
    }
  }

  private insertImages(images: Image[]): void {
    const imagesHtml = images
      .map(({ url }) => {
        const img = createElement('img');
        img.src = url;
        return img.outerHTML;
      })
      .join('');

    this.insertHtml(className(CssClasses.IMAGES), imagesHtml);
  }

  private setCategoryId(id: string): void {
    this.$('bread-crumbs')?.setAttribute('to', id);
  }
}
