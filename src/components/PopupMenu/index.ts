import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import { classSelector } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import html from './template.html';
import { update } from '../../services/API';
import Store from '../../services/Store';
import showToastMessage from '../../utils/show-toast-message';
import Validator from '../../services/Validator';

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
  protected validator: Validator | undefined = undefined;

  protected version: number;

  protected actions: MyCustomerUpdateAction[] = [];

  protected isUpdateSuccessful = false;

  constructor(
    private template: string,
    private submitButtonValue: string,
    private isButtonDisabled: boolean
  ) {
    super(html);
    this.version = Store.customer?.version as number;
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const { OVERLAY, MAIN } = CssClasses;
    this.classList.add(OVERLAY);

    const main = this.$(classSelector(MAIN));
    main?.insertAdjacentHTML('beforeend', this.template);

    const submitButton = this.getSubmitButton();
    submitButton.value = this.submitButtonValue;
    submitButton.disabled = this.isButtonDisabled;
    submitButton.addEventListener('click', this.submit.bind(this));

    this.addEventListener('click', this.closeModalWindow.bind(this));
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

  private closeModalWindow(event: Event): void {
    const target = event.target as HTMLElement;
    const { OVERLAY, ICON_BOX, ICON } = CssClasses;
    if (
      !target.classList.contains(OVERLAY) &&
      !target.classList.contains(ICON_BOX) &&
      !target.classList.contains(ICON)
    ) {
      return;
    }
    this.close();
  }

  public getAllInputs(): HTMLInputElement[] {
    return <HTMLInputElement[]>this.$$(classSelector(CssClasses.INPUT));
  }

  public getSubmitButton(): HTMLInputElement {
    return <HTMLInputElement>this.$(classSelector(CssClasses.SUBMIT_BUTTON));
  }

  protected submit(): void {
    const { version, actions } = this;
    update({ version, actions })
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

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.INFO_UPDATED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }
}
