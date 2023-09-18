import './index.scss';
import { ProductProjection, ProductProjectionPagedSearchResponse } from '@commercetools/platform-sdk';
import html from './catalog.html';
import filterBarsHtml from './filter-bars.html';
import sortBarsHtml from './sort-bars.html';
import Page from '../Page';
import { getInfoOfFilteredProducts } from '../../services/API';
import { filterBrands, filterColors, filterMaterials, filterPrices, filterSizes } from '../../constants/filters';
import { FilterSortingSearchQueries, FiltersType } from '../../types/Catalog';
import highlightSearchingElement from '../../utils/highlight-search-el';
import Store from '../../services/Store';
import { loadProductCategories } from '../../utils/load-data';
import throwError from '../../utils/throw-error';
import { INFINITE_SCROLL, LANG, PRODUCTS_PER_PAGE, SKELETON_CLASS } from '../../config';
import ProductCard from '../../components/ProductCard';
import { classSelector, createElement } from '../../utils/create-element';

enum CssClasses {
  PRODUCTS = 'catalog__products',
  ITEMS = 'catalog__items',
  MORE = 'catalog__more',
  MORE_HIDDEN = 'catalog__more--hidden',
  FORMS = 'catalog__forms',
  FORMS_OPEN = 'catalog__forms--open',
  FILTERS = 'filter__container',
  RESET_FILTERS_BUTTON = 'filter__button-reset',
  SORT = 'sort__container',
  SEARCH_TEXT = 'search__text',
  SEARCH = 'search__container',
  SELECT = 'select',
  TOGGLE = 'filters__toggle',
  NOTHING = 'catalog__nothing',
}

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

const DEFAULT_SORT = 'id asc';

const QUERY_PARAMETERS = ['color', 'brand', 'material', 'size', 'price'];

const SKELETON_CARDS = 4;

const NOTHING_FOUND_TEXT = 'Nothing is found. Try to change your request';

const SCROLL_DELAY = 200;

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

  #currentPage = 1;

  #perPage = PRODUCTS_PER_PAGE;

  #btnMore: HTMLElement | null = null;

  constructor() {
    super(html);
  }

  protected async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.classList.add('page--catalog');

    this.#btnMore = this.$<'a'>(classSelector(CssClasses.MORE));

    this.createSearching();
    this.createFilterBars();
    this.createSortingBars();
    this.handleFiltersToggle();
    this.handleMoreButton();

    if (INFINITE_SCROLL) {
      this.handleScroll();
    }

    await this.setCategory();
    this.loadProducts();
  }

  private insertProductCards(products: ProductProjection[]): void {
    const newCards = products.map((product) => new ProductCard(product.key));
    this.setProductsContainer(newCards);
  }

  private resetFiltersIfButtonClicked(): void {
    const buttonReset = this.$<'button'>(classSelector(CssClasses.RESET_FILTERS_BUTTON));
    if (!buttonReset) {
      return;
    }
    buttonReset.addEventListener('click', (): void => {
      buttonReset.form?.reset();
      this.loadProducts();
    });
  }

  private handleMoreButton(): void {
    this.#btnMore?.addEventListener('click', (event) => {
      event.preventDefault();
      this.loadMoreProducts();
    });
  }

  private handleScroll(): void {
    let loadProductsTimer: number;
    window.addEventListener('scroll', () => {
      window.clearTimeout(loadProductsTimer);
      loadProductsTimer = window.setTimeout(this.checkScroll.bind(this), SCROLL_DELAY);
    });
  }

  private checkScroll(): void {
    const { height = 0 } = window.visualViewport || {};
    const { top = 0 } = this.#btnMore?.getBoundingClientRect() || {};
    if (top && top < height) {
      this.loadMoreProducts();
    }
  }

  private loadMoreProducts(): void {
    this.#currentPage += 1;
    this.loadProducts();
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

  private setProductsContainer(nodes: (Node | string)[], clear = false): void {
    const container = this.$(classSelector(CssClasses.ITEMS));
    container?.querySelectorAll(classSelector(SKELETON_CLASS)).forEach((el) => el.remove());

    if (clear) {
      container?.replaceChildren(...nodes);
    } else {
      container?.append(...nodes);
    }
  }

  private createWaitingSymbol(reset: boolean): void {
    const emptyCards = Array(SKELETON_CARDS)
      .fill(0)
      .map(() => createElement('product-card', { className: SKELETON_CLASS }));
    this.#btnMore?.classList.toggle(CssClasses.MORE_HIDDEN, true);
    this.setProductsContainer(emptyCards, reset);
  }

  private renderResults(response: ProductProjectionPagedSearchResponse): void {
    const { results, total = 0, limit, count, offset } = response;
    const hasMore = offset + limit < total;

    if (count) {
      this.insertProductCards(results);
    } else {
      this.emptyResults();
    }

    this.#btnMore?.classList.toggle(CssClasses.MORE_HIDDEN, !hasMore);
  }

  private emptyResults(): void {
    const message = createElement('p', { className: CssClasses.NOTHING }, NOTHING_FOUND_TEXT);
    this.setProductsContainer([message], true);
  }

  private createFilterBars(): void {
    const filterContainer = this.$<'form'>(classSelector(CssClasses.FILTERS));
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
    const filtersContainer = this.$<'div'>(classSelector(CssClasses.FORMS));
    const filtersToggle = this.$<'button'>(classSelector(CssClasses.TOGGLE));
    if (!filtersContainer || !filtersToggle) {
      return;
    }

    filtersToggle.addEventListener('click', () => {
      filtersContainer.classList.toggle(CssClasses.FORMS_OPEN);
    });
  }

  private createSortingBars(): void {
    const sortingContainer = this.$<'form'>(classSelector(CssClasses.SORT));
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
    return [sort, DEFAULT_SORT].filter((e) => e);
  }

  private createSearching(): void {
    const form = this.$<'form'>(classSelector(CssClasses.SEARCH));
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
    const newSearch = paramsString !== this.#prevParams;

    if (onlyOnChanges && !newSearch) {
      return;
    }

    if (newSearch) {
      this.#currentPage = 1;
    }

    const limit = this.#perPage;
    const offset = (this.#currentPage - 1) * limit;
    Object.assign(params, { limit, offset });

    this.toggleLoading();
    this.createWaitingSymbol(newSearch);
    this.#prevParams = paramsString;

    getInfoOfFilteredProducts(params)
      .then((body) => {
        saveInStorage(body.results);
        this.renderResults(body);
        this.toggleLoading(false);
      })
      .catch(throwError);
  }

  private updateSearchParams(): void {
    this.$$<'select'>('select').forEach(({ name, value }) => {
      Object.assign(CatalogPage.filterSortingValues, { [name]: value });
    });

    CatalogPage.searchingText = this.$<'input'>(classSelector(CssClasses.SEARCH_TEXT))?.value || '';
  }
}
