import './modal.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';

const CssClasses = {
  COMPONENT: 'modal',
  OVERLAY: 'modal__overlay',
  HEADER: 'modal__header',
  CONTENT: 'modal__content',
  CLOSE: 'modal__close',
  HAS_MODAL: 'has-modal',
};

export default class ModalDialog extends BaseComponent {
  #content: (Node | string)[] = [];

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const { CONTENT, CLOSE, COMPONENT, OVERLAY } = CssClasses;
    this.classList.add(COMPONENT);

    const close = (event: Event): void => {
      event.preventDefault();
      this.close();
    };

    this.$(`.${CONTENT}`)?.replaceChildren(...this.#content);
    this.$(`.${CLOSE}`)?.addEventListener('click', close);
    this.$(`.${OVERLAY}`)?.addEventListener('click', close);
  }

  public setContent(nodes: (Node | string)[]): void {
    this.#content = nodes;
  }

  public show(): void {
    const { body } = document;
    body.append(this);
    body.classList.add(CssClasses.HAS_MODAL);
  }

  public close(): void {
    this.remove();
    document.body.classList.remove(CssClasses.HAS_MODAL);
  }
}
