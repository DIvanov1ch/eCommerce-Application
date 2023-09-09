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

const FILTERS = {
  price: filterPrices,
  color: filterColors,
  brand: filterBrands,
  material: filterMaterials,
  size: filterSizes,
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
  private static filterSortingValues: FiltersType = { ...defaultFilterSortingValues };

  private static searchingText = '';

  private static categoryId = '';

  #prevParams = '';

  constructor() {
    super(html);
  }

  protected async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.classList.add('page--catalog');

    this.createSearching();
    this.createFilterBars();
    this.createSortingBars();
    this.handleFiltersToggle();

    await this.setCategory();
    this.loadProducts();
  }

  private createFilteredProductCards(products: ProductProjection[]): void {
    this.$(`.${CssClasses.PRODUCTS}`)?.replaceChildren(...products.map((product) => new ProductCard(product.key)));
  }

  private resetFiltersIfButtonClicked(): void {
    const buttonReset = this.$<'button'>(`.${CssClasses.RESETFILTERSBUTTON}`);
    if (!buttonReset) {
      return;
    }
    buttonReset.addEventListener('click', (): void => {
      buttonReset.form?.reset();
      this.loadProducts();
    });
  }

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

  private createFilterBarsOptions(arrayOfValuesForOption: string[], name: string): void {
    const select = this.$<'select'>(`[name="${name}"]`);
    select?.append(...arrayOfValuesForOption.map((value) => new Option(value)));
    select?.addEventListener('change', (): void => {
      this.loadProducts();
    });
  }

  private clearProductsContainer(innerHTML = ''): void {
    this.insertHtml(`.${CssClasses.PRODUCTS}`, innerHTML);
  }

  private createWaitingSymbol(): void {
    const cardHtml = '<product-card class="skeleton"></product-card>';
    this.clearProductsContainer(cardHtml.repeat(4));
  }

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

  private createFilterBars(): void {
    const filterContainer = this.$<'form'>(`.${CssClasses.FILTERS}`);
    if (!filterContainer) {
      return;
    }
    filterContainer.innerHTML = filterBarsHtml;

    Object.entries(FILTERS).forEach(([name, list]) => {
      this.createFilterBarsOptions(list, name);
    });

    this.resetFiltersIfButtonClicked();
  }

  private handleFiltersToggle(): void {
    const filtersContainer = this.$<'div'>(`.${CssClasses.FORMS}`);
    const filtersToggle = this.$<'button'>(`.${CssClasses.TOGGLE}`);
    if (!filtersContainer || !filtersToggle) {
      return;
    }

    filtersToggle.addEventListener('click', () => {
      filtersContainer.classList.toggle(CssClasses.FORMS_OPEN);
    });
  }

  private createSortingBars(): void {
    const sortingContainer = this.$<'form'>(`.${CssClasses.SORT}`);
    if (!sortingContainer) {
      return;
    }

    sortingContainer.innerHTML = sortBarsHtml;
    const select = createElement('select', { name: 'sort', className: CssClasses.SELECT });
    select.append(...Object.entries(SORT_OPTIONS).map(([value, label]) => new Option(label, value)));
    sortingContainer.append(select);

    select.addEventListener('change', () => {
      this.loadProducts();
    });
  }

  private static createSortingQuery(): string[] {
    const { sort } = CatalogPage.filterSortingValues;
    return [sort].filter((e) => e);
  }

  private createSearching(): void {
    const form = this.$<'form'>(`.${CssClasses.SEARCH}`);
    if (!form) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.loadProducts(true);
    });

    form.addEventListener('reset', () => {
      setTimeout(() => this.loadProducts(true), 0);
    });
  }

  private static createSearchingQuery(): string {
    return CatalogPage.searchingText;
  }

  private static highLightFoundText(element: HTMLElement, textArray: string[]): string {
    const newElement = element;
    textArray.forEach((text) => {
      if (text.length > 1) {
        newElement.innerHTML = CatalogPage.findAndHighLightText(newElement, text);
      }
    });
    return newElement.innerHTML;
  }

  private static findAndHighLightText(element: HTMLElement, text: string): string {
    const str = element.innerHTML;
    const parts = str.split(' ').map((el) => {
      return highlightSearchingElement(el, text);
    });
    const newTextForElement = parts.join(' ');
    return newTextForElement;
  }

  private static createFiltersSortingSearchQueries(): FilterSortingSearchQueries {
    return {
      filterQuery: CatalogPage.createFilterQuery(),
      sortingQuery: CatalogPage.createSortingQuery(),
      searchQuery: CatalogPage.createSearchingQuery(),
    };
  }

  private async setCategory(): Promise<void> {
    const slug = this.getAttribute('params') || '';
    this.$('bread-crumbs')?.setAttribute('slug', slug);

    const categorySlug = slug.split('/').pop() || '';
    CatalogPage.categoryId = await getCategoryIdBySlug(categorySlug);
  }

  private loadProducts(onlyOnChanges = false): void {
    this.updateSearchParams();
    const params = CatalogPage.createFiltersSortingSearchQueries();
    const paramsString = JSON.stringify(params);

    if (onlyOnChanges && paramsString === this.#prevParams) {
      return;
    }

    this.toggleLoading();
    this.createWaitingSymbol();
    this.#prevParams = paramsString;

    getInfoOfFilteredProducts(params)
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

    CatalogPage.searchingText = this.$<'input'>(`.${CssClasses.SEARCHTEXT}`)?.value || '';
  }
}
