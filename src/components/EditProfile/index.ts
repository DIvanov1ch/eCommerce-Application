import { Customer, MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import Store from '../../services/Store';
import { getInputValue, setInputValue } from '../../utils/service-functions';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import InputID from '../../enums/input-id';
import { idSelector } from '../../utils/create-element';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import Validator from '../../services/Validator';

const SubmitBtnValue = {
  SAVE: 'Save',
};

const ToastMessage = {
  INFO_UPDATED: 'Personal information updated',
  ERROR: 'Something went wrong',
};

export default class EditProfile extends PopupMenu {
  constructor() {
    super(html, SubmitBtnValue.SAVE, true);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const inputs = this.getAllInputs();
    const submitButton = this.getSubmitButton();
    this.validator = new Validator(inputs, submitButton);

    EditProfile.fillTemplate();
  }

  private static fillTemplate(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer as Customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    setInputValue(idSelector(FIRST_NAME), firstName);
    setInputValue(idSelector(LAST_NAME), lastName);
    setInputValue(idSelector(DATE_OF_BIRTH), dateOfBirth);
    setInputValue(idSelector(EMAIL), email);
  }

  protected setRequestBody(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer as Customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    const newFirstName = getInputValue(idSelector(FIRST_NAME));
    const newLastName = getInputValue(idSelector(LAST_NAME));
    const newDateOfBirth = getInputValue(idSelector(DATE_OF_BIRTH));
    const newEmail = getInputValue(idSelector(EMAIL));
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
