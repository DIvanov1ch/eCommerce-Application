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
import { FilterSortingSearchQueries, FiltersType } from '../../types/Catalog';
import highlightSearchingElement from '../../utils/highlight-search-el';
import PriceBox from '../../components/PriceBox';

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

  private static searchingText: string;

  constructor() {
    super(html);
    CatalogPage.filterSortingValues = structuredClone(defaultFilterSortingValues);
    CatalogPage.searchingText = '';
    getInfoOfFilteredProducts({})
      .then(({ body }) => {
        this.createProductContainerWithWaitingSymbol(body.results);
        this.createFilterBars();
        this.createSortingBars();
        this.createSearching();
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
    productName.innerHTML = CatalogPage.highLightFoundText(productName, CatalogPage.searchingText.split(' '));
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
    productDescription.innerHTML = CatalogPage.highLightFoundText(
      productDescription,
      CatalogPage.searchingText.split(' ')
    );
    productCard.append(productDescription);
  };

  private static createProductPrice = (productCard: HTMLElement, prices: Price[]): void => {
    const isPrice = prices.length;
    if (isPrice) {
      const {
        value: { centAmount },
      } = prices[0];
      const REALPRICE = centAmount;
      const DISCOUNT = Number(prices[0].discounted?.value.centAmount);
      const priceBox = new PriceBox();
      priceBox.setPrice(REALPRICE);
      priceBox.setDiscounted(DISCOUNT);
      productCard.append(priceBox);
    }
  };

  private createFilteredProductCards = (productsArray: ProductProjection[]): void => {
    const productContainer = this.querySelector(`.${CssClasses.PRODUCTS}`) as HTMLElement;
    productsArray.forEach((product): void => {
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
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
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
      if (parentElement.classList.contains(CssClasses.FILTERPRICE))
        CatalogPage.filterSortingValues.price = parentElement.value;
      if (parentElement.classList.contains(CssClasses.FILTERCOLOR))
        CatalogPage.filterSortingValues.color = parentElement.value;
      if (parentElement.classList.contains(CssClasses.FILTERSIZE))
        CatalogPage.filterSortingValues.size = parentElement.value;
      if (parentElement.classList.contains(CssClasses.FILTERBRAND))
        CatalogPage.filterSortingValues.brand = parentElement.value;
      if (parentElement.classList.contains(CssClasses.FILTERMATERIAL))
        CatalogPage.filterSortingValues.material = parentElement.value;
      this.clearProductsContainer();
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
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
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
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
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
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
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
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

  private createSearching = (): void => {
    this.resetSearchingTextIfButtonClicked();
    this.searchTextIfButtonClicked();
    this.searchTextIfEntered();
    this.searchTextIfUnfocused();
  };

  private resetSearchingTextIfButtonClicked = (): void => {
    const resetSearchingButton = this.querySelector(`.${CssClasses.RESETSEARCHBUTTON}`) as HTMLElement;
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    resetSearchingButton.addEventListener('click', () => {
      if (CatalogPage.searchingText === '') {
        searchingText.value = '';
      }
      if (CatalogPage.searchingText !== '') {
        searchingText.value = '';
        CatalogPage.searchingText = '';
        getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
          .then(({ body }) => {
            this.createProductContainerWithWaitingSymbol(body.results);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };

  private searchTextIfButtonClicked = (): void => {
    const searchingButton = this.querySelector(`.${CssClasses.SEARCHBUTTON}`) as HTMLElement;
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingButton.addEventListener('click', () => {
      CatalogPage.searchingText = searchingText.value;
      getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
        .then(({ body }) => {
          this.createProductContainerWithWaitingSymbol(body.results);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  private searchTextIfEntered = (): void => {
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingText.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        CatalogPage.searchingText = searchingText.value;
        getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
          .then(({ body }) => {
            this.createProductContainerWithWaitingSymbol(body.results);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };

  private searchTextIfUnfocused = (): void => {
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingText.addEventListener('blur', () => {
      if (searchingText.value !== CatalogPage.searchingText) {
        CatalogPage.searchingText = searchingText.value;
        getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
          .then(({ body }) => {
            this.createProductContainerWithWaitingSymbol(body.results);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };

  private static createSearchingQuery = (): string => {
    const queryParams = CatalogPage.searchingText;
    return queryParams;
  };

  private static highLightFoundText = (element: HTMLElement, textArray: string[]): string => {
    const newElement = element;
    textArray.forEach((text) => {
      if (text.length > 1) {
        newElement.innerHTML = CatalogPage.findAndHighLightText(newElement, text);
      }
    });
    return newElement.innerHTML;
  };

  private static findAndHighLightText = (element: HTMLElement, text: string): string => {
    const str = element.innerHTML;
    const parts = str.split(' ').map((el) => {
      return highlightSearchingElement(el, text);
    });
    const newTextForElement = parts.join(' ');
    return newTextForElement;
  };

  private static createFiltersSortingSearchQueries = (): FilterSortingSearchQueries => {
    return {
      filterQuery: CatalogPage.createFilterQuery() || [],
      sortingQuery: CatalogPage.createSortingQuery() || [],
      searchQuery: CatalogPage.createSearchingQuery() || '',
    };
  };
}
