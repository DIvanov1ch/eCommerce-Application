import { ProductProjection } from '@commercetools/platform-sdk';
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
import Store from '../../services/Store';
import loadProductCategories from '../../utils/load-data';
import throwError from '../../utils/throw-error';
import { LANG } from '../../config';
import ProductCard from '../../components/ProductCard';

const defaultFilterSortingValues = {
  price: 'any',
  color: 'any',
  brand: 'any',
  material: 'any',
  size: 'any',
  byPrice: 'no',
  byName: 'no',
};

const QUERY_PARAMETERS = ['color', 'brand', 'material', 'size', 'price'];

async function getCategoryIdBySlug(categorySlug: string): Promise<string> {
  if (!Store.categories) {
    await loadProductCategories();
  }

  if (!Store.categories) {
    return '';
  }

  const category = Store.categories.find(({ slug }) => slug[LANG] === categorySlug);
  return category?.id || '';
}

function saveInStorage(products: ProductProjection[]): void {
  products.forEach((product) => {
    Store.products[`${product.key}`] = product;
  });
}

export default class CatalogPage extends Page {
  private static filterSortingValues: FiltersType;

  private static searchingText: string;

  private static categoryId = '';

  constructor() {
    super(html);
    CatalogPage.filterSortingValues = structuredClone(defaultFilterSortingValues);
    CatalogPage.searchingText = '';
  }

  protected async connectedCallback(): Promise<void> {
    super.connectedCallback();

    this.createFilterBars();
    this.createSortingBars();
    this.createSearching();

    await this.setCategory();
    this.loadProducts();
  }

  private createFilteredProductCards = (products: ProductProjection[]): void => {
    this.$(`.${CssClasses.PRODUCTS}`)?.replaceChildren(...products.map((product) => new ProductCard(product.key)));
  };

  private resetFiltersIfButtonClicked = (): void => {
    const buttonReset = this.querySelector(`.${CssClasses.RESETFILTERSBUTTON}`) as HTMLElement;
    const filterContainer = this.querySelector(`.${CssClasses.FILTERS}`) as HTMLFormElement;
    buttonReset.addEventListener('click', (): void => {
      filterContainer.reset();
      CatalogPage.filterSortingValues = defaultFilterSortingValues;
      this.loadProducts();
    });
  };

  private static createFilterQuery(): string[] {
    const queryParams = Object.entries(CatalogPage.filterSortingValues)
      .map(([key, value]) => {
        if (!QUERY_PARAMETERS.includes(key) || value === 'any') {
          return '';
        }
        if (key === 'price') {
          const [from, to] = value.split('-').map((p) => 100 * parseInt(p, 10));
          return `variants.price.centAmount:range (${from} to ${to})`;
        }

        return `variants.attributes.${key}:"${value}"`;
      })
      .filter((e) => e);

    const { categoryId } = CatalogPage;
    if (categoryId) {
      queryParams.push(`categories.id: subtree("${categoryId}")`);
    }

    return queryParams;
  }

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
      this.loadProducts();
    });
  };

  private clearProductsContainer(innerHTML = ''): void {
    this.insertHtml(`.${CssClasses.PRODUCTS}`, innerHTML);
  }

  private createWaitingSymbol = (): void => {
    const cardHtml = '<product-card class="skeleton"></product-card>';
    this.clearProductsContainer(cardHtml.repeat(4));
  };

  private renderResults(body: ProductProjection[]): void {
    if (body.length) {
      this.createFilteredProductCards(body);
    } else {
      this.emptyResults();
    }
  }

  private emptyResults(): void {
    this.clearProductsContainer('<p>Nothing is found. Try to change your request</p>');
  }

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
      this.loadProducts();
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
      this.loadProducts();
      priceSorting.value = defaultFilterSortingValues.byPrice;
    });
    priceSorting.addEventListener('change', () => {
      CatalogPage.filterSortingValues.byPrice = priceSorting.value;
      this.loadProducts();
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
        this.loadProducts();
      }
    });
  };

  private searchTextIfButtonClicked = (): void => {
    const searchingButton = this.querySelector(`.${CssClasses.SEARCHBUTTON}`) as HTMLElement;
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingButton.addEventListener('click', () => {
      CatalogPage.searchingText = searchingText.value;
      this.loadProducts();
    });
  };

  private searchTextIfEntered = (): void => {
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingText.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        CatalogPage.searchingText = searchingText.value;
        this.loadProducts();
      }
    });
  };

  private searchTextIfUnfocused = (): void => {
    const searchingText = this.querySelector(`.${CssClasses.SEARCHTEXT}`) as HTMLInputElement;
    searchingText.addEventListener('blur', () => {
      if (searchingText.value !== CatalogPage.searchingText) {
        CatalogPage.searchingText = searchingText.value;
        this.loadProducts();
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

  private async setCategory(): Promise<void> {
    const slug = this.getAttribute('params') || '';
    this.$('bread-crumbs')?.setAttribute('slug', slug);

    const categorySlug = slug.split('/').pop() || '';
    CatalogPage.categoryId = await getCategoryIdBySlug(categorySlug);
  }

  private loadProducts(): void {
    this.toggleLoading();
    this.createWaitingSymbol();

    getInfoOfFilteredProducts(CatalogPage.createFiltersSortingSearchQueries())
      .then(({ body }) => {
        saveInStorage(body.results);
        this.renderResults(body.results);
        this.toggleLoading(false);
      })
      .catch(throwError);
  }
}
