import './bread-crumbs.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import loadProductCategories from '../../utils/load-data';
import { LANG } from '../../config';
import throwError from '../../utils/throw-error';
import { createElement } from '../../utils/create-element';

const CssClasses = {
  COMPONENT: 'bread-crumbs',
  NAV: 'bread-crumbs__nav',
  LIST: 'bread-crumbs__list',
  ITEM: 'bread-crumbs__item',
  LINK: 'bread-crumbs__link',
};

const ERRORS = {
  LOADING: 'Error loading categories...',
  NOT_FOUND: 'Slickbird ate all the crumbs...',
};

const ROOT = { name: 'Catalog', slug: 'catalog' };

type Cat = {
  name: string;
  slug: string;
  parent?: string;
};

export default class BreadCrumbs extends BaseComponent {
  #categories: Record<string, Cat> = {
    root: ROOT,
  };

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.toggleLoading();
  }

  private async prepareCategories(): Promise<boolean> {
    if (!Store.categories) {
      await loadProductCategories();
    }

    this.toggleLoading(false);

    if (!Store.categories) {
      this.showError(ERRORS.LOADING);
      return false;
    }

    Store.categories.forEach((category) => {
      const {
        id,
        name: { [LANG]: name },
        slug: { [LANG]: slug },
        parent: { id: parent } = {},
      } = category;

      this.#categories[id] = { name, slug, parent };
    });

    return true;
  }

  private async plantCrumbsTo(id = ''): Promise<void> {
    if (!(await this.prepareCategories())) {
      return;
    }

    const crumbs = [];

    let category = this.#categories[id];
    while (category) {
      const { parent = '' } = category;
      crumbs.push(category);
      category = this.#categories[parent];
    }

    if (!crumbs.length) {
      this.showError(ERRORS.NOT_FOUND);
      return;
    }

    this.renderCrumbs(crumbs.reverse());
  }

  private async plantCrumbsForSlug(fullSlug = ''): Promise<void> {
    if (!(await this.prepareCategories())) {
      return;
    }

    const cats = Object.values(this.#categories);
    const crumbs: Cat[] = [];

    fullSlug.split('/').forEach((slug) => {
      const category = cats.find((cat: Cat) => cat.slug === slug);
      if (category) {
        crumbs.push(category);
      }
    });

    this.renderCrumbs(crumbs);
  }

  private renderCrumbs(crumbs: Cat[]): void {
    const { NAV, LIST, ITEM, LINK } = CssClasses;
    const allCrumbs = [this.#categories.root, ...crumbs];
    const slugs: string[] = [];

    const a = (href: string, text: string): HTMLAnchorElement => createElement('a', { href, className: LINK }, text);
    const li = (child: Element): HTMLLIElement => createElement('li', { className: ITEM }, child);

    const items = allCrumbs
      .map(({ slug, name }) => {
        slugs.push(slug);
        return a(`#${slugs.join('/')}`, name);
      })
      .map(li);

    const list = createElement('ul', { className: LIST }, ...items);
    const nav = createElement('nav', { className: NAV }, list);

    this.replaceChildren(nav);
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'to') {
      this.plantCrumbsTo(newValue).catch(throwError);
    }

    if (name === 'slug') {
      this.plantCrumbsForSlug(newValue).catch(throwError);
    }
  }

  private static get observedAttributes(): string[] {
    return ['to', 'slug'];
  }

  private showError(text: string): void {
    this.replaceChildren(text);
  }
}
