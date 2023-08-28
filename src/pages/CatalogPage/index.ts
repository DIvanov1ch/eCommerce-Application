import { Product } from '@commercetools/platform-sdk';
import './catalog.scss';
import html from './catalog.html';
import Page from '../Page';
import { getInfoOfAllProducts } from '../../services/API';

const englishAndAmerican = 'en-US';

export default class CatalogPage extends Page {
  constructor() {
    super(html);
    getInfoOfAllProducts()
      .then(({ body }) => {
        CatalogPage.createProductCard(body.results);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }

  private static createProductCard = (productsArray: Product[]): void => {
    const productBlock = document.querySelector('.product__block') as HTMLElement;
    productsArray.forEach((product): void => {
      const productCard = document.createElement('div');
      productCard.innerHTML = `<div class="product__card">
      <img class="product__image" src="${
        product.masterData.current.masterVariant.images?.length
          ? product.masterData.current.masterVariant.images[0].url
          : ''
      }"">
      <div class="product__name">${product.masterData.current.name[englishAndAmerican]}</div>
      <div class="product__description">${
        product.masterData.current.description ? product.masterData.current.description[englishAndAmerican] : ''
      }</div>
      </div>`;
      productBlock.append(productCard);
    });
  };
}
