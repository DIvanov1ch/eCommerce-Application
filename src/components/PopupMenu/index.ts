import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import { classSelector } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import html from './template.html';
import { updateCustomer } from '../../services/API';
import Store from '../../services/Store';
import showToastMessage from '../../utils/show-toast-message';
import throwError from '../../utils/throw-error';
import './popup.scss';
import FormValidator from '../../services/FormValidator';

enum CssClasses {
  OVERLAY = 'pop-up__overlay',
  MAIN = 'pop-up__main',
  ICON_BOX = 'image__box',
  ICON = 'image',
  HAS_MODAL = 'has-modal',
  INPUT = 'input-module__input-field',
  SUBMIT_BUTTON = 'submit-button',
}

const ToastMessage = {
  INFO_UPDATED: 'Information has been updated',
  ERROR: 'Something went wrong',
};

export default class PopupMenu extends BaseComponent {
  protected validator!: FormValidator;

  protected version!: number;

  protected actions: MyCustomerUpdateAction[] = [];

  protected isUpdateSuccessful = false;

  constructor(
    private template: string,
    private submitButtonValue: string,
    private isButtonDisabled = false
  ) {
    super(html);
    if (!Store.customer) {
      throwError(new Error('Customer does not exist'));
      return;
    }
    this.version = Store.customer.version;
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const { OVERLAY, MAIN } = CssClasses;
    this.classList.add(OVERLAY);

    const main = this.$(classSelector(MAIN));
    main?.insertAdjacentHTML('beforeend', this.template);

    this.setSubmitButtonParams();
    this.addEventListener('click', this.closeModalWindow.bind(this));
  }

  public insertElements(elements: Element[]): void {
    const { MAIN } = CssClasses;
    const main = this.$(classSelector(MAIN));
    elements.forEach((element) => main?.insertAdjacentElement('beforeend', element));
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

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.INFO_UPDATED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }

  private closeModalWindow(event: Event): void {
    const { target } = event;
    const { OVERLAY, ICON_BOX, ICON } = CssClasses;
    if (
      target instanceof HTMLElement &&
      !target.classList.contains(OVERLAY) &&
      !target.classList.contains(ICON_BOX) &&
      !target.classList.contains(ICON)
    ) {
      return;
    }
    this.close();
  }

  private setSubmitButtonParams(): void {
    const { SUBMIT_BUTTON } = CssClasses;
    const button = this.$<'input'>(classSelector(SUBMIT_BUTTON));
    if (button === null) {
      throwError(new Error(`${SUBMIT_BUTTON} is 'null'`));
      return;
    }
    button.value = this.submitButtonValue;
    button.disabled = this.isButtonDisabled;
    button.addEventListener('click', this.submit.bind(this));
  }

  protected submit(): void {
    const { version, actions } = this;
    updateCustomer({ version, actions })
      .then(({ body }) => {
        Store.customer = body;
        this.isUpdateSuccessful = true;
        this.showMessage();
      })
      .catch(() => {
        this.isUpdateSuccessful = false;
        this.showMessage();
      });
  }
}
