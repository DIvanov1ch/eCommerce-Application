import { ProductProjection } from '@commercetools/platform-sdk';
import './index.scss';
import CssClasses from './css-classes';
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
import { createElement } from '../../utils/create-element';

const defaultFilterSortingValues = {
  price: 'any',
  color: 'any',
  brand: 'any',
  material: 'any',
  size: 'any',
  sort: '',
};

const SORT_OPTIONS = {
  '': 'Featured',
  'price asc': '↗ Price',
  'price desc': '↘ Price',
  'name.en asc': 'Title (A-Z)',
  'name.en desc': 'Title (Z-A)',
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
    const select = this.$<'select'>(`.${cssClass}`);
    select?.append(...arrayOfValuesForOption.map((value) => new Option(value)));
    select?.addEventListener('change', (): void => {
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

  private createSortingBars = (): void => {
    const sortingContainer = this.$<'form'>(`.${CssClasses.SORT}`);
    if (!sortingContainer) {
      return;
    }

    sortingContainer.innerHTML = sortBarsHtml;
    const select = createElement('select', { name: 'sort' });
    select.append(...Object.entries(SORT_OPTIONS).map(([value, label]) => new Option(label, value)));
    sortingContainer.append(select);

    select.addEventListener('change', () => {
      this.loadProducts();
    });
  };

  private static createSortingQuery = (): string[] => {
    const { sort } = CatalogPage.filterSortingValues;
    return [sort].filter((e) => e);
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
    this.updateSearchParams();
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

  private updateSearchParams(): void {
    this.$$<'select'>('select').forEach(({ name, value }) => {
      Object.assign(CatalogPage.filterSortingValues, { [name]: value });
    });
  }
}
