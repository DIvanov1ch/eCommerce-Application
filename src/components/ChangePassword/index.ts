import { Customer, MyCustomerChangePassword } from '@commercetools/platform-sdk';
import InputID from '../../enums/input-id';
import { idSelector } from '../../utils/create-element';
import { getInputValue } from '../../utils/service-functions';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import { changePassword } from '../../services/API';
import Store from '../../services/Store';
import showToastMessage from '../../utils/show-toast-message';
import Validator from '../../services/Validator';
import ErrorMessages from '../../constants';
import loginUser from '../../utils/login';

const SubmitBtnValue = {
  SAVE_CHANGES: 'Save changes',
};

const ToastMessage = {
  PASSWORD_CHANGED: 'Your password has been changed',
  ERROR: 'The given current password does not match',
};

export default class ChangePassword extends PopupMenu {
  protected requestBody: MyCustomerChangePassword = {
    version: 0,
    currentPassword: '',
    newPassword: '',
  };

  constructor() {
    super(html, SubmitBtnValue.SAVE_CHANGES, true);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const inputs = this.getAllInputs();
    const submitButton = this.getSubmitButton();
    this.validator = new Validator(inputs, submitButton);
  }

  protected setRequestBody(): boolean {
    const { NEW_PASSWORD, OLD_PASSWORD, RE_ENTERED_PASSWORD } = InputID;
    const { version } = Store.customer as Customer;
    const currentPassword = getInputValue(idSelector(OLD_PASSWORD));
    const newPassword = getInputValue(idSelector(NEW_PASSWORD));
    const reenteredPassword = getInputValue(idSelector(RE_ENTERED_PASSWORD));
    if (newPassword !== reenteredPassword) {
      this.showPasswordMismatchError();
      return false;
    }
    this.requestBody = { version, currentPassword, newPassword };
    return true;
  }

  protected submit(): void {
    if (!this.setRequestBody()) {
      return;
    }
    const { requestBody } = this;
    changePassword(requestBody)
      .then(({ body }) => {
        Store.customer = body;
        this.isUpdateSuccessful = true;
        const { email } = Store.customer;
        const password = requestBody.newPassword;
        loginUser(email, password).then().catch(console.error);
        this.showMessage();
        this.close();
      })
      .catch(() => {
        this.isUpdateSuccessful = false;
        this.showMessage();
        this.showInvalidCurrentPasswordError();
      });
  }

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.PASSWORD_CHANGED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
  }

  private showPasswordMismatchError(): void {
    const { RE_ENTERED_PASSWORD } = InputID;
    const message = ErrorMessages.PASSWORD_MISMATCH.password;
    this.validator?.setErrorMessage(RE_ENTERED_PASSWORD, message);
    this.validator?.showErrorMessage(RE_ENTERED_PASSWORD);
    this.validator?.setSubmitButtonState();
  }

  private showInvalidCurrentPasswordError(): void {
    const message = ErrorMessages.INVALID_CURRENT_PASSWORD.password;
    this.validator?.setErrorMessage(InputID.OLD_PASSWORD, message);
    this.validator?.showErrorMessage(InputID.OLD_PASSWORD);
    this.validator?.setSubmitButtonState();
  }
}
