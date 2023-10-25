import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import FormValidator from '../../services/FormValidator';
import NameField from '../InputField/NameField';
import EmailField from '../InputField/EmailField';
import DateOfBirthField from '../InputField/DateOfBirthField';

const SubmitBtnValue = {
  SAVE: 'Save',
};

const ToastMessage = {
  INFO_UPDATED: 'Personal information updated',
  ERROR: 'Something went wrong',
};

export default class EditProfile extends PopupMenu {
  private firstName = new NameField('firstName');

  private lastName = new NameField('lastName');

  private email = new EmailField();

  private dateOfBirth = new DateOfBirthField();

  constructor() {
    super(html, SubmitBtnValue.SAVE, true);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.render();
    this.validator = new FormValidator(this);
  }

  private render(): void {
    this.insertElements([this.firstName, this.lastName, this.email, this.dateOfBirth]);
    const { firstName, lastName, email, dateOfBirth } = this.customer;
    this.firstName.setInputValue(firstName);
    this.lastName.setInputValue(lastName);
    this.email.setInputValue(email);
    this.dateOfBirth.setInputValue(dateOfBirth);
  }

  protected setRequestBody(): void {
    const { firstName, lastName, email, dateOfBirth } = this.customer;
    const newFirstName = this.firstName.getInputValue();
    const newLastName = this.lastName.getInputValue();
    const newEmail = this.email.getInputValue();
    const newDateOfBirth = this.dateOfBirth.getInputValue();
    const actions: MyCustomerUpdateAction[] = [];
    if (newFirstName !== firstName) {
      actions.push({
        action: UpdateActions.SET_FIRST_NAME,
        firstName: newFirstName,
      });
    }
    if (newLastName !== lastName) {
      actions.push({
        action: UpdateActions.SET_LAST_NAME,
        lastName: newLastName,
      });
    }
    if (newDateOfBirth !== dateOfBirth) {
      actions.push({
        action: UpdateActions.SET_DATE_OF_BIRTH,
        dateOfBirth: newDateOfBirth,
      });
    }
    if (newEmail !== email) {
      actions.push({
        action: UpdateActions.CHANGE_EMAIL,
        email: newEmail,
      });
    }
    this.actions = actions;
  }

  protected submit(): void {
    this.setRequestBody();
    super.submit();
  }

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.INFO_UPDATED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }
}
