import { MyCustomerChangePassword } from '@commercetools/platform-sdk';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import { changePassword } from '../../services/API';
import Store from '../../services/Store';
import showToastMessage from '../../utils/show-toast-message';
import loginUser from '../../utils/login';
import PasswordField from '../InputField/PasswordField';
import FormValidator from '../../services/FormValidator';
import throwError from '../../utils/throw-error';
import { WarningMessage } from '../../interfaces';

const SubmitBtnValue = {
  SAVE_CHANGES: 'Save changes',
};

const ToastMessage = {
  PASSWORD_CHANGED: 'Your password has been changed',
  ERROR: 'The given current password does not match',
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your current password',
  invalidValue: 'Your password may be incorrect',
};

const PasswordFieldId = {
  CURRENT: 'old-password',
  NEW: 'new-password',
  REENTERED: 're-entered-password',
};

const LabelText = {
  CURRENT: 'Current password',
  NEW: 'New password',
  REENTERED: 'Re-enter new password',
};

export default class ChangePassword extends PopupMenu {
  private currentPassword = new PasswordField(
    {
      inputParams: { id: PasswordFieldId.CURRENT, type: 'password' },
      labelText: LabelText.CURRENT,
    },
    ErrorMessage
  );

  private newPassword = new PasswordField({
    inputParams: { id: PasswordFieldId.NEW, type: 'password' },
    labelText: LabelText.NEW,
  });

  private reenteredPassword = new PasswordField({
    inputParams: { id: PasswordFieldId.REENTERED, type: 'password' },
    labelText: LabelText.REENTERED,
  });

  protected requestBody: MyCustomerChangePassword = {
    version: 0,
    currentPassword: '',
    newPassword: '',
  };

  constructor() {
    super(html, SubmitBtnValue.SAVE_CHANGES, true);
    if (!Store.customer) {
      throwError(new Error('Customer does not exist'));
      return;
    }
    this.version = Store.customer.version;
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.insertElements([this.currentPassword, this.newPassword, this.reenteredPassword]);
    this.validator = new FormValidator(this);
  }

  protected setRequestBody(): boolean {
    const { version } = this;
    const currentPassword = this.currentPassword.getInputValue();
    const newPassword = this.newPassword.getInputValue();
    const reenteredPassword = this.reenteredPassword.getInputValue();
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
    const message: WarningMessage = { emptyField: '', invalidValue: 'Password mismatch' };
    this.reenteredPassword.setWarning(message);
    this.reenteredPassword.displayWarning();
  }

  private showInvalidCurrentPasswordError(): void {
    const message: WarningMessage = { emptyField: '', invalidValue: 'The given current password does not match' };
    this.currentPassword.setWarning(message);
    this.currentPassword.displayWarning();
  }
}
