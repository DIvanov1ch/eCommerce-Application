import { ProductProjection, Image } from '@commercetools/platform-sdk';
import './product.scss';
import html from './product.html';
import Page from '../Page';
import Router from '../../services/Router';
import { getProductProjectionByKey } from '../../services/API';
import { LANG } from '../../config';
import throwError from '../../utils/throw-error';
import PriceBox from '../../components/PriceBox';
import ImageSlider from '../../components/ImageSlider';
import { classSelector } from '../../utils/create-element';
import Store from '../../services/Store';
import ProductVariants from '../../components/ProductVariants';

Router.registerRoute('product', 'product-page');

const PAGE_TITLE = 'Product details';

const CssClasses = {
  COMPONENT: 'details',
  NAME: 'details__name',
  DESCRIPTION: 'details__description',
  IMAGES: 'details__images',
  PRICES: 'details__prices',
  PARAMS: 'details__params',
  VARIANTS: 'details__variants',
};

export default class ProductPage extends Page {
  #params = '';

  #priceBox = new PriceBox();

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
      const { key } = product;
      Store.products[String(key)] = product;
      this.render(product);
    }
  }

  private render(product: ProductProjection): void {
    const { NAME, DESCRIPTION } = CssClasses;
    const {
      key,
      name: { [LANG]: name },
      description: { [LANG]: description } = {},
      masterVariant: { images, prices = [] },
      categories,
    } = product;
    const { id: categoryId = '' } = categories[0] || {};
    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    this.insertHtml(classSelector(NAME), name);
    this.insertHtml(classSelector(DESCRIPTION), description);

    this.insertImages(images);
    this.setCategoryId(categoryId);
    this.renderVariants(key);
    this.setPrice(price, discounted);
  }

  private setPrice(price: number, discounted: number): void {
    const priceContainer = this.$(classSelector(CssClasses.PRICES));
    this.#priceBox.setPrice(price);
    this.#priceBox.setDiscounted(discounted);

    priceContainer?.replaceChildren(this.#priceBox);
  }

  private renderVariants(key = ''): void {
    const variants = new ProductVariants(key);
    this.$(classSelector(CssClasses.VARIANTS))?.append(variants);
  }

  private insertImages(images?: Image[]): void {
    if (!images || !images.length) {
      return;
    }

    const imagesString = images.map(({ url }) => url).join(';');
    const slider = new ImageSlider();
    slider.setAttribute('modal', 'true');
    slider.setImages(imagesString);

    this.$(classSelector(CssClasses.IMAGES))?.replaceChildren(slider);
  }

  private setCategoryId(id: string): void {
    this.$('bread-crumbs')?.setAttribute('to', id);
  }
}
