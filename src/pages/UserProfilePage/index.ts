import {
  Address,
  ErrorResponse,
  MyCustomerChangePassword,
  MyCustomerUpdate,
  MyCustomerUpdateAction,
} from '@commercetools/platform-sdk';
import Toastify, { Options } from 'toastify-js';
import 'toastify-js/src/toastify.css';
import Page from '../Page';
import html from './user-profile.html';
import addressLine from './html-templates/address-line-template.html';
import personalTemplate from './html-templates/personal-popup-template.html';
import passwordTemplate from './html-templates/password-popup-template.html';
import addressTemplate from './html-templates/address-popup-template.html';
import deleteTemplate from './html-templates/delete-popup-template.html';
import './user-profile.scss';
import Store from '../../services/Store';
import { pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import InputID from '../../enums/input-id';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';
import warningIcon from '../../assets/icons/warning-icon.png';
import { changePassword, login, logout, update } from '../../services/API';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_YET = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#login">login page</a> in ${TIMER_HTML} sec...</p>`;
const PASSWORD_DOT = '•';
const ADDRESS_TITLE = {
  EDIT: `<h2 class="template__title">Manage your addresses</h2>`,
  ADD: `<h2 class="template__title">Add new address</h2>`,
};
const SubmitBtnValue = {
  DELETE: 'Delete',
  SAVE: 'Save',
  ADD: 'Add address',
  SAVE_CHANGES: 'Save changes',
};
const ToastMessage = {
  INFO_UPDATED: 'Personal information updated',
  PASSWORD_CHANGED: 'Your password has been changed',
  ERROR: 'Something went wrong',
};
const ToastBackground = {
  GREEN: 'linear-gradient(to right, #00b09b, #96c93d)',
  RED: 'linear-gradient(to right, #e91e63, #f44336)',
};
const getToastOptions = (message: string, background: string): Options => {
  return {
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: 'top',
    position: 'center',
    stopOnFocus: true,
    style: {
      background,
    },
    offset: {
      x: 0,
      y: '35px',
    },
  };
};

export default class UserProfile extends Page {
  private template = '';

  private isProfileEditing = false;

  private isPasswordChanging = false;

  private isAddressDeleting = false;

  private isAddressEditing = false;

  private isAddressAdding = false;

  private addressID = '';

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
    this.setCallback();
  }

  private createAddressLines(): void {
    const container = this.querySelector(`.${CssClasses.LINE_WRAPPER}`);
    Store.customer.addresses.forEach((): void => {
      container?.insertAdjacentHTML('beforeend', addressLine);
    });
  }

  private setInputValue(selector: string, value = ''): void {
    const input = this.$<'input'>(selector);
    if (input) {
      input.value = value;
    }
  }

  private getInputValue(selector: string): string {
    const input = this.$<'input'>(selector);
    if (input !== null) {
      return input.value;
    }
    return '';
  }

  private setElementTextContent(selector: string, textContent = '', container: HTMLElement = this): void {
    const element = container.querySelector(selector);
    if (element) {
      element.textContent = textContent;
    }
  }

  private makeCheckboxChecked(selector: string): void {
    const checkbox = this.$<'input'>(selector);
    if (checkbox) {
      checkbox.checked = true;
    }
  }

  private setUserProfileInfo(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = CssClasses;

    this.setElementTextContent(`.${FIRST_NAME}`, firstName);
    this.setElementTextContent(`.${LAST_NAME}`, lastName);
    this.setElementTextContent(`.${DATE_OF_BIRTH}`, dateOfBirth);
    this.setElementTextContent(`.${EMAIL}`, email);
  }

  private setPasswordLengthDisplay(): void {
    const { password } = Store.customer;
    const { PASSWORD } = CssClasses;
    const length = password?.length as number;
    this.setElementTextContent(`.${PASSWORD}`, PASSWORD_DOT.repeat(length));
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const lines = this.$$(`.${CssClasses.ADDRESS_LINE}`);
    lines.forEach((line, rowIndex) => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
      const addressTypeContainer = <HTMLDivElement>line.querySelector(`.${CssClasses.TYPE_OF_ADDRESS}`);
      const addressContainer = <HTMLDivElement>line.querySelector(`.${CssClasses.ADDRESS_BOX}`);
      const addressTypes: string[] = [];
      if (id === defaultShippingAddressId) {
        addressTypes.push(CssClasses.DEFAULT_SHIPPING);
      }
      if (id === defaultBillingAddressId) {
        addressTypes.push(CssClasses.DEFAULT_BILLING);
      }
      if (shippingAddressIds?.includes(id as string)) {
        addressTypes.push(CssClasses.SHIPPING);
      }
      if (billingAddressIds?.includes(id as string)) {
        addressTypes.push(CssClasses.BILLING);
      }
      addressContainer.setAttribute('id', id as string);
      this.setElementTextContent(`.${STREET}`, streetName, line);
      this.setElementTextContent(`.${CITY}`, city, line);
      this.setElementTextContent(`.${POSTAL_CODE}`, postalCode, line);
      this.setElementTextContent(`.${COUNTRY}`, country, line);
      UserProfile.setAddressTypes(addressTypeContainer, addressTypes);
    });
  }

  private static setAddressTypes(container: HTMLDivElement, addressTypes: string[]): void {
    addressTypes.forEach((type) => {
      [...container.children].find((child) => child.classList.contains(type))?.classList.remove(CssClasses.HIDDEN);
    });
  }

  private checkIfUserLoggedIn(): void {
    if (!Store.user.loggedIn) {
      this.goToMainPage(HTML_NOT_YET).then().catch(console.error);
      return;
    }
    this.createAddressLines();
    this.setUserProfileInfo();
    this.setPasswordLengthDisplay();
    this.setAddressInfo();
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#login');
    }
  }

  private enableEditProfileInfoMode(): void {
    this.isProfileEditing = true;
    this.template = personalTemplate;
    this.setModalContent(SubmitBtnValue.SAVE, false);
    this.showModalWindow();
  }

  private enableChangePasswordMode(): void {
    this.isPasswordChanging = true;
    this.template = passwordTemplate;
    this.setModalContent(SubmitBtnValue.SAVE_CHANGES, false);
    this.showModalWindow();
  }

  private enableDeleteAddressMode(event: Event): void {
    this.isAddressDeleting = true;
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(`.${CssClasses.CONTAINER}`) as HTMLDivElement;
    this.addressID = fieldContainer.id;
    this.template = deleteTemplate;
    this.setModalContent(SubmitBtnValue.DELETE, true);
    this.showModalWindow();
  }

  private enableEditAddressMode(event: Event): void {
    this.isAddressEditing = true;
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(`.${CssClasses.CONTAINER}`) as HTMLDivElement;
    this.addressID = fieldContainer.id;
    this.template = addressTemplate;
    this.setModalContent(SubmitBtnValue.SAVE, false, ADDRESS_TITLE.EDIT);
    this.showModalWindow();
  }

  private enableAddNewAddressMode(): void {
    this.isAddressAdding = true;
    this.template = addressTemplate;
    this.setModalContent(SubmitBtnValue.ADD, false, ADDRESS_TITLE.ADD);
    this.showModalWindow();
  }

  private disableEditMode(): void {
    this.isAddressAdding = false;
    this.isAddressEditing = false;
    this.isProfileEditing = false;
    this.isAddressDeleting = false;
    this.isPasswordChanging = false;
    this.addressID = '';
  }

  private setCallback(): void {
    const writeProfileInfoBox = this.$(`.${CssClasses.NAME_BOX} .${CssClasses.WRAPPER_WRITE}`);
    writeProfileInfoBox?.addEventListener('click', this.enableEditProfileInfoMode.bind(this));

    const writePasswordBox = this.$(`.${CssClasses.PASSWORD_BOX} .${CssClasses.WRAPPER_WRITE}`);
    writePasswordBox?.addEventListener('click', this.enableChangePasswordMode.bind(this));

    const writeAddressBoxes = this.$$(`.${CssClasses.ADDRESS_BOX} .${CssClasses.WRAPPER_WRITE}`);
    writeAddressBoxes.forEach((box) => box.addEventListener('click', this.enableEditAddressMode.bind(this)));

    const deleteBoxes = this.$$(`.${CssClasses.WRAPPER_DELETE}`);
    deleteBoxes.forEach((box) => box.addEventListener('click', this.enableDeleteAddressMode.bind(this)));

    const overlay = this.$(`.${CssClasses.OVERLAY}`);
    overlay?.addEventListener('click', this.closeModalWindow.bind(this));

    const addButton = this.$(`.${CssClasses.ADD_BUTTON_BOX}`);
    addButton?.addEventListener('click', this.enableAddNewAddressMode.bind(this));

    const submitBtn = this.querySelector(`.${CssClasses.SUBMIT_BUTTON}`);
    submitBtn?.addEventListener('click', this.submit.bind(this));
  }

  private showModalWindow(): void {
    const modal = this.querySelector(`.${CssClasses.OVERLAY}`);
    modal?.classList.remove(CssClasses.HIDDEN);
  }

  private closeModalWindow(event: Event): void {
    const target: HTMLDivElement = event.target as HTMLDivElement;
    if (
      !target.classList.contains(CssClasses.OVERLAY) &&
      !target.classList.contains(CssClasses.ICON_BOX) &&
      !target.classList.contains(CssClasses.ICON)
    ) {
      return;
    }
    this.hideModalWindow();
  }

  private hideModalWindow(): void {
    const modal = this.querySelector(`.${CssClasses.OVERLAY}`);
    modal?.classList.add(CssClasses.HIDDEN);
    this.disableEditMode();
  }

  private setModalContent(submitButtonValue: string, isButtonEnabled: boolean, title?: string): void {
    this.clearModalContent();
    const contentBox = this.$(`.${CssClasses.MODAL}`);

    if (title) {
      contentBox?.insertAdjacentHTML('afterbegin', title);
    }

    if (isButtonEnabled) {
      this.enableInput(`.${CssClasses.SUBMIT_BUTTON}`);
    } else {
      this.disableInput(`.${CssClasses.SUBMIT_BUTTON}`);
    }

    this.setInputValue(`.${CssClasses.SUBMIT_BUTTON}`, submitButtonValue);
    contentBox?.insertAdjacentHTML('beforeend', this.template);
    this.fillTemplate();
  }

  private clearModalContent(): void {
    const contentBox = this.querySelector(`.${CssClasses.MODAL}`);
    if (contentBox) {
      while (contentBox.firstElementChild) {
        contentBox.firstElementChild.remove();
      }
    }
  }

  private fillTemplate(): void {
    if (this.isAddressEditing) {
      this.fillAddressTemplate();
    }
    if (this.isProfileEditing) {
      this.fillPersonalTemplate();
    }
    if (this.isAddressDeleting) {
      this.fillDeleteTemplate();
      return;
    }
    this.setInputCalback();
  }

  private fillAddressTemplate(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressID) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const { STREET, CITY, POSTAL_CODE, SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    this.setInputValue(`#${STREET}`, streetName);
    this.setInputValue(`#${CITY}`, city);
    this.setInputValue(`#${POSTAL_CODE}`, postalCode);
    if (this.addressID === defaultShippingAddressId) {
      this.makeCheckboxChecked(`#${DEFAULT_SHIPPING}`);
    }
    if (this.addressID === defaultBillingAddressId) {
      this.makeCheckboxChecked(`#${DEFAULT_BILLING}`);
    }
    if (shippingAddressIds?.includes(this.addressID)) {
      this.makeCheckboxChecked(`#${SHIPPING_COUNTRY}`);
    }
    if (billingAddressIds?.includes(this.addressID)) {
      this.makeCheckboxChecked(`#${BILLING_COUNTRY}`);
    }
  }

  private fillPersonalTemplate(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    this.setInputValue(`#${FIRST_NAME}`, firstName);
    this.setInputValue(`#${LAST_NAME}`, lastName);
    this.setInputValue(`#${DATE_OF_BIRTH}`, dateOfBirth);
    this.setInputValue(`#${EMAIL}`, email);
  }

  private fillDeleteTemplate(): void {
    const { addresses } = Store.customer;
    const addressToDelete = addresses.find((address) => address.id === this.addressID) as Address;
    const { streetName, city, postalCode, country } = addressToDelete;
    const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
    const container = <HTMLDivElement>this.$(`.${CssClasses.DELETE_BOX}`);
    this.setElementTextContent(`.${STREET}`, streetName, container);
    this.setElementTextContent(`.${CITY}`, city, container);
    this.setElementTextContent(`.${POSTAL_CODE}`, postalCode, container);
    this.setElementTextContent(`.${COUNTRY}`, country, container);
  }

  private setInputCalback(): void {
    const fields = <HTMLInputElement[]>this.$$(`.${CssClasses.FIELD}`);
    fields.forEach((field) => field.addEventListener('input', this.checkResult.bind(this)));
  }

  private disableInput(selector: string): void {
    const submitInput = this.$<'input'>(selector);
    if (submitInput) {
      submitInput.disabled = true;
    }
  }

  private enableInput(selector: string): void {
    const submitInput = this.$<'input'>(selector);
    if (submitInput) {
      submitInput.disabled = false;
    }
  }

  private checkResult(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (isValidValue(input.id, input.value)) {
      this.hideErrorMessage(input.id);
    } else {
      const errorMessage = !input.value
        ? ErrorMessages.EMPTY_FIELD[`${input.name}`]
        : ErrorMessages.INVALID_VALUE[`${input.name}`];
      this.setInputErrorMessage(input.id, errorMessage);
      this.showErrorMessage(input.id);
    }
  }

  private hideErrorMessage(inputID: string): void {
    const input = this.$(`#${inputID}`) as HTMLInputElement;
    const errorBox: Element | null = input.nextElementSibling;
    input.classList.remove(CssClasses.INPUT_ERROR);
    if (errorBox !== null) {
      errorBox.classList.add(CssClasses.HIDDEN);
    }
    this.enableInput(`.${CssClasses.SUBMIT_BUTTON}`);
  }

  private showErrorMessage(inputID: string): void {
    const input = this.$(`#${inputID}`) as HTMLInputElement;
    const errorBox: Element | null = input.nextElementSibling;
    input.classList.add(CssClasses.INPUT_ERROR);
    if (errorBox !== null) {
      errorBox.classList.remove(CssClasses.HIDDEN);
    }
    this.disableInput(`.${CssClasses.SUBMIT_BUTTON}`);
  }

  private setInputErrorMessage(inputID: string, message: string): void {
    const input = this.$(`#${inputID}`) as HTMLInputElement;
    const errorBox = input.nextElementSibling as HTMLDivElement;
    const errorImg: HTMLImageElement | null = errorBox.querySelector(`.${CssClasses.ERROR_ICON}`);
    const errorContent = errorBox.querySelector(`.${CssClasses.ERROR_TEXT}`);
    if (errorContent !== null && errorImg !== null) {
      errorContent.textContent = message;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      errorImg.src = warningIcon;
    }
  }

  private submit(): void {
    if (this.isProfileEditing) {
      this.submitProfileInfo();
    }
    if (this.isPasswordChanging) {
      this.submitNewPassword();
    }
    if (this.isAddressAdding) {
      console.log('add address');
    }
    if (this.isAddressEditing) {
      console.log('edit address');
    }
    if (this.isAddressDeleting) {
      console.log('delete address');
    }
  }

  private submitProfileInfo(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    const newFirstName = this.getInputValue(`#${FIRST_NAME}`);
    const newLastName = this.getInputValue(`#${LAST_NAME}`);
    const newDateOfBirth = this.getInputValue(`#${DATE_OF_BIRTH}`);
    const newEmail = this.getInputValue(`#${EMAIL}`);
    const { version } = Store.customer;
    const actions: MyCustomerUpdateAction[] = [];
    if (newFirstName !== firstName) {
      actions.push({
        action: 'setFirstName',
        firstName: newFirstName,
      });
    }
    if (newLastName !== lastName) {
      actions.push({
        action: 'setLastName',
        lastName: newLastName,
      });
    }
    if (newDateOfBirth !== dateOfBirth) {
      actions.push({
        action: 'setDateOfBirth',
        dateOfBirth: newDateOfBirth,
      });
    }
    if (newEmail !== email) {
      actions.push({
        action: 'changeEmail',
        email: newEmail,
      });
    }
    this.hideModalWindow();
    this.updateUserProfile({ version, actions });
  }

  private submitNewPassword(): void {
    const { NEW_PASSWORD, OLD_PASSWORD, RE_ENTERED_PASSWORD } = InputID;
    const { version } = Store.customer;
    const currentPassword = this.getInputValue(`#${OLD_PASSWORD}`);
    const newPassword = this.getInputValue(`#${NEW_PASSWORD}`);
    const reenteredPassword = this.getInputValue(`#${RE_ENTERED_PASSWORD}`);
    if (newPassword !== reenteredPassword) {
      this.setInputErrorMessage(NEW_PASSWORD, ErrorMessages.PASSWORD_MISMATCH.password);
      this.setInputErrorMessage(RE_ENTERED_PASSWORD, ErrorMessages.PASSWORD_MISMATCH.password);
      this.showErrorMessage(NEW_PASSWORD);
      this.showErrorMessage(RE_ENTERED_PASSWORD);
      return;
    }
    this.changeUserPassword({ version, currentPassword, newPassword });
  }

  private updateUserProfile(user: MyCustomerUpdate): void {
    update(user)
      .then(({ body }) => {
        const { firstName, lastName } = body;
        Store.user = { loggedIn: true, firstName, lastName };
        Store.customer = body;
        UserProfile.showMessage(ToastMessage.INFO_UPDATED, true);
        this.setUserProfileInfo();
      })
      .catch(() => UserProfile.showMessage(ToastMessage.ERROR, false));
  }

  private changeUserPassword(requestBody: MyCustomerChangePassword): void {
    changePassword(requestBody)
      .then(({ body }) => {
        Store.customer = body;
        logout();
        UserProfile.logIn(requestBody.newPassword);
        UserProfile.showMessage(ToastMessage.PASSWORD_CHANGED, true);
        this.setPasswordLengthDisplay();
        this.hideModalWindow();
      })
      .catch((error: ErrorResponse) => {
        UserProfile.showMessage(error.message, false);
        this.setInputErrorMessage(InputID.OLD_PASSWORD, error.message);
        this.showErrorMessage(InputID.OLD_PASSWORD);
      });
  }

  private static showMessage(message: string, isResultOk: boolean): void {
    const props: Options = isResultOk
      ? getToastOptions(message, ToastBackground.GREEN)
      : getToastOptions(message, ToastBackground.RED);
    Toastify(props).showToast();
  }

  private static logIn(password: string): void {
    login(Store.customer.email, password).then().catch(console.error);
  }
}
