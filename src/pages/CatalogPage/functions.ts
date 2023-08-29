import { Image, LocalizedString, Product, Price } from '@commercetools/platform-sdk';
import './index.scss';
import CssClasses from './css-classes';
import filterBarsHtml from './filterBars.html';
import { createElement } from '../../utils/create-element';

const englishAndAmerican = 'en-US';

const createProductImage = (productCard: HTMLElement, images: Image[] | undefined): void => {
  const productImage = createElement('img', { className: CssClasses.IMAGE });
  if (images?.length) {
    productImage.src = images[0].url;
  } else {
    productImage.classList.add(CssClasses.NOPICTURE);
  }
  productCard.append(productImage);
};

const createProductName = (productCard: HTMLElement, name: LocalizedString): void => {
  const productName = createElement('div', { className: CssClasses.NAME, innerHTML: name[englishAndAmerican] });
  productCard.append(productName);
};

const createProductDescription = (productCard: HTMLElement, description: LocalizedString | undefined): void => {
  const productDescription = createElement('div', {
    className: CssClasses.DESCRIPTION,
    innerHTML: `${description ? description[englishAndAmerican] : ''}`,
  });
  productCard.append(productDescription);
};

const cancelMainPriceIfThereIsDiscount = (productPrice: HTMLElement, productDiscountedPrice: HTMLElement): void => {
  if (productDiscountedPrice.innerText.length > 0) {
    productPrice.classList.add(CssClasses.CANCELPRICE);
  }
};

const cancelDiscountIfThereIsOnlyPrice = (productDiscount: HTMLElement, productDiscountedPrice: HTMLElement): void => {
  if (productDiscountedPrice.innerText.length === 0) {
    const element = productDiscount;
    element.innerHTML = '';
  }
};

const createProductPrice = (productCard: HTMLElement, prices: Price[]): void => {
  const isPrice = prices.length;
  const REALPRICE = isPrice ? prices[0].value.centAmount / 100 : 0;
  const PRICEWITHDISCOUNT =
    isPrice && prices[0].discounted?.value.centAmount
      ? ((1 - Number(prices[0].discounted?.value.centAmount) / prices[0].value.centAmount) * 100).toFixed(0)
      : '';
  const DISCOUNT =
    isPrice && prices[0].discounted?.value.centAmount
      ? (Number(prices[0].discounted?.value.centAmount) / 100).toString()
      : '';
  const productPrice = createElement('div', {
    className: CssClasses.PRICE,
    innerHTML: `Price: ${REALPRICE}$`,
  });
  const productDiscount = createElement('div', {
    className: CssClasses.DISCOUNT,
    innerHTML: `-${PRICEWITHDISCOUNT}%`,
  });
  const productDiscountedPrice = createElement('div', {
    className: CssClasses.DISCOUNTED,
    innerHTML: `${DISCOUNT}${isPrice && prices[0].discounted?.value.centAmount ? '$' : ''}`,
  });
  cancelMainPriceIfThereIsDiscount(productPrice, productDiscountedPrice);
  cancelDiscountIfThereIsOnlyPrice(productDiscount, productDiscountedPrice);
  productCard.append(productPrice);
  productCard.append(productDiscount);
  productCard.append(productDiscountedPrice);
};

export const createProductCard = (productsArray: Product[]): void => {
  const productContainer = document.querySelector(`.${CssClasses.PRODUCTS}`) as HTMLElement;
  productsArray.forEach((product): void => {
    const productCard = createElement('div', {
      className: CssClasses.CARD,
    });
    const {
      masterVariant: { images },
      name,
      description,
    } = product.masterData.current;
    const productImage = images;
    const productName = name;
    const productDescription = description;
    const productPrices: Price[] | undefined = product.masterData.current.masterVariant.prices;
    createProductImage(productCard, productImage);
    createProductName(productCard, productName);
    createProductDescription(productCard, productDescription);
    if (productPrices !== undefined) {
      createProductPrice(productCard, productPrices);
    }
    productContainer.append(productCard);
  });
};

export const createFilterBars = (): void => {
  const filterContainer = document.querySelector(`.${CssClasses.FILTERS}`) as HTMLElement;
  filterContainer.innerHTML = filterBarsHtml;
};
