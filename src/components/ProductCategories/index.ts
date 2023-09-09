import './categories.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import Store from '../../services/Store';
import { loadProductCategories } from '../../utils/load-data';
import { LANG } from '../../config';
import { createElement } from '../../utils/create-element';
import throwError from '../../utils/throw-error';

const CssClasses = {
  COMPONENT: 'categories',
  NAV: 'categories__nav',
  LIST: 'categories__list',
  ITEM: 'categories__item',
  LINK: 'categories__link',
  ACTIVE: 'categories__link--active',
  LEVEL: 'categories__list--level',
};

const ERRORS = {
  LOADING: 'Error loading categories...',
};

const ROOT = { id: 'root', name: 'Catalog', slug: 'catalog', order: 0, parent: '' };

type Cat = {
  id: string;
  name: string;
  slug: string;
  parent: string;
  order: number;
  children?: Cat[];
  path?: string[];
};

export default class ProductCategories extends BaseComponent {
  #categories: Cat[] = [ROOT];

  #tree: Cat[] = [];

  #showRoot = true;

  #maxDepth = 0;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.toggleLoading();

    this.prepareCategories().then(this.render.bind(this)).catch(throwError);
  }

  private async prepareCategories(): Promise<boolean> {
    if (!Store.categories.length) {
      await loadProductCategories();
    }

    this.toggleLoading(false);

    if (!Store.categories.length) {
      this.showError(ERRORS.LOADING);
      return false;
    }

    Store.categories.forEach((category) => {
      const {
        id,
        name: { [LANG]: name },
        slug: { [LANG]: slug },
        parent: { id: parent = 'root' } = {},
        orderHint,
      } = category;

      this.#categories.push({ id, name, slug, parent, order: parseFloat(orderHint) });
    });

    this.#categories.sort((a, b) => a.order - b.order);
    this.buildTree();

    return true;
  }

  private buildTree(): void {
    const getChildren = (parentId = '', parentPath: string[] = []): Cat[] => {
      return this.#categories
        .filter(({ parent }) => parent === parentId)
        .map((category) => {
          const path = [...parentPath, category.slug];
          this.#maxDepth = Math.max(this.#maxDepth, path.length);

          return { ...category, path, children: getChildren(category.id, path) };
        });
    };

    this.#tree = getChildren('');
  }

  private render(): void {
    const { NAV, LIST, ITEM, LINK, ACTIVE, LEVEL } = CssClasses;
    const { hash } = window.location;
    let maxDepth = this.#maxDepth;
    let tree = [...this.#tree];

    if (!this.#showRoot) {
      tree = tree.pop()?.children || [];
      maxDepth -= 1;
    }

    const a = (category: Cat): HTMLAnchorElement => {
      const { path = [], name } = category;
      const href = `#${path.join('/')}`;
      const link = createElement('a', { href, className: LINK }, name);
      link.classList.toggle(ACTIVE, href === hash);
      return link;
    };

    const list = (categories: Cat[], level = 0): HTMLUListElement => {
      const items = categories.map((category: Cat): HTMLLIElement => {
        const li = createElement('li', { className: ITEM }, a(category));
        if (category.children?.length) {
          li.append(list(category.children, level + 1));
        }
        return li;
      });
      const classes = [LIST, `${LEVEL}-${maxDepth - level}`];
      if (!level) {
        classes.push(`${LEVEL}-top`);
      }
      return createElement('ul', { className: classes.join(' ') }, ...items);
    };

    const categories = list(tree);
    const nav = createElement('nav', { className: NAV }, categories);
    this.replaceChildren(nav);
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'root') {
      this.setRoot(newValue);
    }
  }

  private static get observedAttributes(): string[] {
    return ['root'];
  }

  private showError(text: string): void {
    this.replaceChildren(text);
  }

  public setRoot(value: string): void {
    this.#showRoot = value === 'true';
    this.render();
  }
}
