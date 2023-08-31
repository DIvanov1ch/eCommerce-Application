import { Image, LocalizedString, Price, ProductProjection } from '@commercetools/platform-sdk';
import './index.scss';
import CssClasses from './css-classes';
import { createElement } from '../../utils/create-element';
import html from './catalog.html';
import filterBarsHtml from './filter-bars.html';
import sortBarsHtml from './sort-bars.html';
import Page from '../Page';
import { getInfoOfFilteredProducts } from '../../services/API';
import { filterBrands, filterColors, filterMaterials, filterPrices, filterSizes } from '../../constants/filters';
import { FiltersType } from '../../types/Catalog';

const DELAY = 1000;

const defaultFilterSortingValues = {
  price: 'any',
  color: 'any',
  brand: 'any',
  material: 'any',
  size: 'any',
  byPrice: 'no',
  byName: 'no',
};

export default class CatalogPage extends Page {
  private static filterSortingValues: FiltersType;

  constructor() {
    super(html);
    CatalogPage.filterSortingValues = structuredClone(defaultFilterSortingValues);
    getInfoOfFilteredProducts()
      .then(({ body }) => {
        this.createProductContainerWithWaitingSymbol(body.results);
        this.createFilterBars();
        this.createSortingBars();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }

  private static createProductImage = (productCard: HTMLElement, images: Image[] | undefined): void => {
    const productImage = createElement('img', { className: CssClasses.IMAGE });
    if (images?.length) {
      productImage.src = images[0].url;
    } else {
      productImage.classList.add(CssClasses.NOPICTURE);
    }
    productCard.append(productImage);
  };

  private static createProductName = (productCard: HTMLElement, name: LocalizedString): void => {
    const productName = createElement('div', { className: CssClasses.NAME, innerHTML: name.en });
    productCard.append(productName);
  };

  private static createProductDescription = (
    productCard: HTMLElement,
    description: LocalizedString | undefined
  ): void => {
    const productDescription = createElement('div', {
      className: CssClasses.DESCRIPTION,
      innerHTML: `${description ? description.en.split('\n')[0] : ''}`,
    });
    productCard.append(productDescription);
  };

  private static cancelMainPriceIfThereIsDiscount = (
    productPrice: HTMLElement,
    productDiscountedPrice: HTMLElement
  ): void => {
    if (productDiscountedPrice.innerText.length > 0) {
      productPrice.classList.add(CssClasses.CANCELPRICE);
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

  private static createProductPrice = (productCard: HTMLElement, prices: Price[]): void => {
    const isPrice = prices.length;
    if (isPrice) {
      const {
        value: { centAmount },
      } = prices[0];
      const REALPRICE = centAmount / 100;
      const PRICEWITHDISCOUNT = prices[0].discounted?.value.centAmount
        ? ((1 - Number(prices[0].discounted?.value.centAmount) / centAmount) * 100).toFixed(0)
        : '';
      const DISCOUNT = prices[0].discounted?.value.centAmount
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
        innerHTML: `${DISCOUNT}${prices[0].discounted?.value.centAmount ? '$' : ''}`,
      });
      CatalogPage.cancelMainPriceIfThereIsDiscount(productPrice, productDiscountedPrice);
      CatalogPage.cancelDiscountIfThereIsOnlyPrice(productDiscount, productDiscountedPrice);
      productCard.append(productPrice);
      productCard.append(productDiscount);
      productCard.append(productDiscountedPrice);
    }
  };

  private createFilteredProductCards = (productsArray: ProductProjection[]): void => {
    const productContainer = this.querySelector(`.${CssClasses.PRODUCTS}`) as HTMLElement;
    productsArray.forEach((product): void => {
      console.log(product);
      const productCard = createElement('div', {
        className: CssClasses.CARD,
      });
      const {
        masterVariant: { images },
        name,
        description,
        masterVariant: { prices },
      } = product;
      CatalogPage.createProductImage(productCard, images);
      CatalogPage.createProductName(productCard, name);
      CatalogPage.createProductDescription(productCard, description);
      if (prices !== undefined) {
        CatalogPage.createProductPrice(productCard, prices);
      }
      productContainer.append(productCard);
    });
  };

  private resetFiltersIfButtonClicked = (): void => {
    const buttonReset = this.querySelector(`.${CssClasses.RESETFILTERSBUTTON}`) as HTMLElement;
    const filterContainer = this.querySelector(`.${CssClasses.FILTERS}`) as HTMLFormElement;
    buttonReset.addEventListener('click', (): void => {
      filterContainer.reset();
      this.clearProductsContainer();
      CatalogPage.filterSortingValues = defaultFilterSortingValues;
      getInfoOfFilteredProducts()
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  private static createFilterQuery = (): string[] => {
    const queryParams: string[] = [];
    if (CatalogPage.filterSortingValues.color !== 'any') {
      queryParams.push(`variants.attributes.color:"${CatalogPage.filterSortingValues.color}"`);
    }
    if (CatalogPage.filterSortingValues.brand !== 'any') {
      queryParams.push(`variants.attributes.brand:"${CatalogPage.filterSortingValues.brand}"`);
    }
    if (CatalogPage.filterSortingValues.size !== 'any') {
      queryParams.push(`variants.attributes.size:"${CatalogPage.filterSortingValues.size}"`);
    }
    if (CatalogPage.filterSortingValues.material !== 'any') {
      queryParams.push(`variants.attributes.material:"${CatalogPage.filterSortingValues.material}"`);
    }
    if (CatalogPage.filterSortingValues.price !== 'any') {
      const firstValue = (Number(CatalogPage.filterSortingValues.price?.split('-')[0]) * 100).toString();
      const secondValue = (Number(CatalogPage.filterSortingValues.price?.split('-')[1].slice(0, -1)) * 100).toString();
      queryParams.push(`variants.price.centAmount:range (${firstValue} to ${secondValue})`);
    }
    return queryParams;
  };

  private createFilterBarsOptions = (arrayOfValuesForOption: string[], cssClass: string): void => {
    const parentElement = this.querySelector(`.${cssClass}`) as HTMLSelectElement;
    arrayOfValuesForOption.forEach((value): void => {
      const optionElement = createElement('option', {
        innerHTML: value,
      });
      parentElement.append(optionElement);
    });
    parentElement.addEventListener('change', (): void => {
      switch (cssClass) {
        case CssClasses.FILTERPRICE:
          CatalogPage.filterSortingValues.price = parentElement.value;
          break;
        case CssClasses.FILTERCOLOR:
          CatalogPage.filterSortingValues.color = parentElement.value;
          break;
        case CssClasses.FILTERSIZE:
          CatalogPage.filterSortingValues.size = parentElement.value;
          break;
        case CssClasses.FILTERBRAND:
          CatalogPage.filterSortingValues.brand = parentElement.value;
          break;
        case CssClasses.FILTERMATERIAL:
          CatalogPage.filterSortingValues.material = parentElement.value;
          break;
        default:
          break;
      }
      this.clearProductsContainer();
      getInfoOfFilteredProducts(CatalogPage.createFilterQuery(), CatalogPage.createSortingQuery())
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  private clearProductsContainer = (): void => {
    const productContainer = this.querySelector(`.${CssClasses.PRODUCTS}`) as HTMLElement;
    productContainer.innerHTML = '';
  };

  private createWaitingSymbol = (): void => {
    const productContainer = this.querySelector(`.${CssClasses.PRODUCTS}`) as HTMLElement;
    productContainer.innerHTML = '<div class="product__loader"></div>';
  };

  private createProductContainerWithWaitingSymbol = (body: ProductProjection[]): void => {
    this.createWaitingSymbol();
    setTimeout(() => {
      this.clearProductsContainer();
      this.createFilteredProductCards(body);
    }, DELAY);
  };

  private createFilterBars = (): void => {
    const filterContainer = this.querySelector(`.${CssClasses.FILTERS}`) as HTMLFormElement;
    filterContainer.innerHTML = filterBarsHtml;
    this.createFilterBarsOptions(filterPrices, CssClasses.FILTERPRICE);
    this.createFilterBarsOptions(filterColors, CssClasses.FILTERCOLOR);
    this.createFilterBarsOptions(filterSizes, CssClasses.FILTERSIZE);
    this.createFilterBarsOptions(filterBrands, CssClasses.FILTERBRAND);
    this.createFilterBarsOptions(filterMaterials, CssClasses.FILTERMATERIAL);
    this.resetFiltersIfButtonClicked();
  };

  private resetSortingIfButtonClicked = (): void => {
    const buttonReset = this.querySelector(`.${CssClasses.RESETSORTINGBUTTON}`) as HTMLElement;
    const sortingContainer = this.querySelector(`.${CssClasses.SORT}`) as HTMLFormElement;
    buttonReset.addEventListener('click', (): void => {
      sortingContainer.reset();
      this.clearProductsContainer();
      getInfoOfFilteredProducts()
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  private createSortingBars = (): void => {
    const sortingContainer = this.querySelector(`.${CssClasses.SORT}`) as HTMLFormElement;
    sortingContainer.innerHTML = sortBarsHtml;
    const nameSorting = this.querySelector(`.${CssClasses.SORTNAME}`) as HTMLSelectElement;
    const priceSorting = this.querySelector(`.${CssClasses.SORTPRICE}`) as HTMLSelectElement;
    this.resetSortingIfButtonClicked();
    nameSorting.addEventListener('change', () => {
      CatalogPage.filterSortingValues.byName = nameSorting.value;
      getInfoOfFilteredProducts(CatalogPage.createFilterQuery(), CatalogPage.createSortingQuery())
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
      priceSorting.value = defaultFilterSortingValues.byPrice;
    });
    priceSorting.addEventListener('change', () => {
      CatalogPage.filterSortingValues.byPrice = priceSorting.value;
      getInfoOfFilteredProducts(CatalogPage.createFilterQuery(), CatalogPage.createSortingQuery())
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
      nameSorting.value = defaultFilterSortingValues.byName;
    });
  };

  private static createSortingQuery = (): string[] => {
    const queryParams: string[] = [];
    if (CatalogPage.filterSortingValues.byName !== 'no') {
      if (CatalogPage.filterSortingValues.byName === 'ascending') {
        queryParams.push(`name.en asc`);
      } else {
        queryParams.push(`name.en desc`);
      }
    }
    if (CatalogPage.filterSortingValues.byPrice !== 'no') {
      if (CatalogPage.filterSortingValues.byPrice === 'ascending') {
        queryParams.push(`price asc`);
      } else {
        queryParams.push(`price desc`);
      }
    }
    return queryParams;
  };
}
