import './header.scss';
import html from './header.html';
import BaseComponent from '../BaseComponent';

const CssClasses = {
  TOGGLE: 'nav-toggle',
  OPEN: 'nav--open',
  CONTAINER: 'nav-container',
};

export const toggleNavigation = (toggle?: boolean): void => {
  document.body.classList.toggle(CssClasses.OPEN, toggle);
};

export default class PageHeader extends BaseComponent {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('header');

    const menuToggle = this.$(`.${CssClasses.TOGGLE}`);
    if (!menuToggle) {
      return;
    }
    menuToggle.addEventListener('click', (event) => {
      event.preventDefault();
      toggleNavigation();
    });

    this.$(`.${CssClasses.CONTAINER}`)?.addEventListener('click', (event) => {
      const { target } = event;
      if (target instanceof HTMLAnchorElement) {
        const isToggleVisible = String(menuToggle.computedStyleMap().get('visibility')) === 'visible';
        if (isToggleVisible) {
          toggleNavigation();
        }
      }
    });
  }
}
