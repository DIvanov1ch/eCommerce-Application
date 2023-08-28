import { Image, LocalizedString, Product, Price } from '@commercetools/platform-sdk';
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
      const productImage = product.masterData.current.masterVariant.images;
      const productName = product.masterData.current.name;
      const productDescription = product.masterData.current.description;
      const productPrices = product.masterData.current.masterVariant.prices;
      productCard.classList.add('product__card');
      this.createProductImage(productCard, productImage);
      this.createProductName(productCard, productName);
      this.createProductDescription(productCard, productDescription);
      this.createProductPrice(productCard, productPrices);
      productBlock.append(productCard);
    });
  };

  private static createProductImage = (productCard: HTMLElement, images: Image[] | undefined): void => {
    const productImage = document.createElement('img');
    productImage.classList.add('product__image');
    productImage.setAttribute('src', `${images?.length ? images[0].url : ''}`);
    productCard.append(productImage);
  };

  private static createProductName = (productCard: HTMLElement, name: LocalizedString): void => {
    const productName = document.createElement('div');
    productName.classList.add('product__name');
    productName.innerHTML = `${name[englishAndAmerican]}`;
    productCard.append(productName);
  };

  private static createProductDescription = (
    productCard: HTMLElement,
    description: LocalizedString | undefined
  ): void => {
    const productDescription = document.createElement('div');
    productDescription.classList.add('product__description');
    productDescription.innerHTML = `${description ? description[englishAndAmerican] : ''}`;
    productCard.append(productDescription);
  };

  private static createProductPrice = (productCard: HTMLElement, prices: Price[] | undefined): void => {
    const productPrice = document.createElement('div');
    productPrice.classList.add('product__price');
    productPrice.innerHTML = `Price: ${prices?.length ? prices[0].value.centAmount / 100 : 0}$`;
    const productDiscount = document.createElement('div');
    productDiscount.classList.add('product__discount');
    productDiscount.innerHTML = `-${
      prices?.length && prices[0].discounted?.value.centAmount
        ? ((1 - Number(prices[0].discounted?.value.centAmount) / prices[0].value.centAmount) * 100).toFixed(0)
        : ''
    }%`;
    const productDiscountedPrice = document.createElement('div');
    productDiscountedPrice.classList.add('product__discounted-price');
    productDiscountedPrice.innerHTML = `${
      prices?.length && prices[0].discounted?.value.centAmount
        ? (Number(prices[0].discounted?.value.centAmount) / 100).toString()
        : ''
    }${prices?.length && prices[0].discounted?.value.centAmount ? '$' : ''}`;
    this.cancelMainPriceIfThereIsDiscount(productPrice, productDiscountedPrice);
    this.cancelDiscountIfThereIsOnlyPrice(productDiscount, productDiscountedPrice);
    productCard.append(productPrice);
    productCard.append(productDiscount);
    productCard.append(productDiscountedPrice);
  };

  private static cancelMainPriceIfThereIsDiscount = (
    productPrice: HTMLElement,
    productDiscountedPrice: HTMLElement
  ): void => {
    if (productDiscountedPrice.innerText.length > 0) {
      productPrice.classList.add('cancel');
    }
  };

  private static cancelDiscountIfThereIsOnlyPrice = (
    productDiscount: HTMLElement,
    productDiscountedPrice: HTMLElement
  ): void => {
    if (productDiscountedPrice.innerText.length === 0) {
      const element = productDiscount;
      element.innerHTML = '';
    }
  };
}
