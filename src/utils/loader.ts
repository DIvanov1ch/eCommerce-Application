import { createElement } from './create-element';

enum CssClasses {
  LOADER = 'loader',
  PARENT_ELEMENT = 'page-main',
}

const createLoader = (text: string = ''): void => {
  const cartLoader = createElement('div', { className: CssClasses.LOADER });
  cartLoader.innerText = text;
  const parent = document.getElementsByTagName(CssClasses.PARENT_ELEMENT)[0] as HTMLElement;
  parent.append(cartLoader);
  parent.style.opacity = '0.7';
  parent.style.pointerEvents = 'none';
};

const deleteLoader = (): void => {
  const cartLoader = document.querySelector(`.${CssClasses.LOADER}`) as HTMLElement;
  const parent = document.getElementsByTagName(CssClasses.PARENT_ELEMENT)[0] as HTMLElement;
  parent.style.opacity = '1';
  parent.style.pointerEvents = 'all';
  cartLoader.remove();
};

export { createLoader, deleteLoader };
