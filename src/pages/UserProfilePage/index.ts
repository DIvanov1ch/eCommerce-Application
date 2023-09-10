import {
  Address,
  Customer,
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
import { classSelector, idSelector, pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import InputID from '../../enums/input-id';
import ErrorMessages from '../../constants';
import { changePassword, login, logout, update } from '../../services/API';
import { loadCustomer } from '../../utils/load-data';
import UpdateActions from './update-actions';
import LoggedInUser from '../../services/LoggedInUser';
import { Country } from '../../config';
import Validator from '../../services/Validator';
import {
  disableInput,
  enableInput,
  getCheckboxState,
  getInputValue,
  makeCheckboxChecked,
  setElementTextContent,
  setInputValue,
} from '../../utils/service-functions';
import getToastOptions from '../../utils/get-toast-options';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_LOGGED_IN = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#login">login page</a> in ${TIMER_HTML} sec...</p>`;
const HTML_SESSION_EXPIRED = `<h3>Your session has expired</h3>
<div>We're sorry, but we had to log you out and end your session. Please log in to your account <a href="#login">here</a>.</div><div>You will be redirected in ${TIMER_HTML} sec...</div>`;
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
  ADDRESS_SAVED: 'New address saved',
  ADDRESS_REMOVED: 'Address removed',
  ADDRESS_CHANGED: 'Address changed',
  DEFAULT_SHIPPING_ADDRESS_CHANGED: 'Default shipping address changed',
  DEFAULT_BILLING_ADDRESS_CHANGED: 'Default billing address changed',
  ERROR: 'Something went wrong',
};
const ToastBackground = {
  GREEN: 'linear-gradient(to right, #00b09b, #96c93d)',
  RED: 'linear-gradient(to right, #e91e63, #f44336)',
};

export default class UserProfile extends Page {
  private customer: Customer = new LoggedInUser();

  private validator: Validator | undefined = undefined;

  private template = '';

  private isProfileEditing = false;

  private isPasswordChanging = false;

  private isAddressDeleting = false;

  private isAddressEditing = false;

  private isAddressAdding = false;

  private isAddressAction = false;

  private isAddressUpdating = false;

  private isDefaultShippingAddressChanged = false;

  private isDefaultBillingAddressChanged = false;

  private addressUpdateActions: MyCustomerUpdateAction[] = [];

  private addressId = '';

  private checkboxState = {
    billing: false,
    shipping: false,
    defaultBilling: false,
    defaultShipping: false,
  };

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
    this.checkIfTokenFresh();
    this.load();
    this.setCallback();
  }

  private checkIfUserLoggedIn(): void {
    if (!Store.customer) {
      this.goToLoginPage(HTML_NOT_LOGGED_IN).then().catch(console.error);
    }
  }

  private checkIfTokenFresh(): void {
    if (!Store.token || Store.token.expirationTime <= Date.now()) {
      logout();
      Store.customer = undefined;
      this.goToLoginPage(HTML_SESSION_EXPIRED).then().catch(console.error);
    }
  }

  private load(): void {
    loadCustomer()
      .then((customer) => {
        this.customer = customer;
        this.render();
      })
      .catch(() => {
        logout();
        Store.customer = undefined;
        this.goToLoginPage(HTML_SESSION_EXPIRED).then().catch(console.error);
      });
  }

  private render(): void {
    this.renderAddress();
    this.setUserProfileInfo();
    this.setPasswordLengthDisplay();
  }

  private renderAddress(): void {
    this.createAddressLines();
    this.setAddressInfo();
    this.setAddressIconsCallback();
  }

  private async goToLoginPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#login');
    }
  }

  private createAddressLines(): void {
    const { LINE_WRAPPER } = CssClasses;
    this.clearContent(classSelector(LINE_WRAPPER));
    const container = this.$(classSelector(LINE_WRAPPER));
    this.customer.addresses.forEach((): void => {
      container?.insertAdjacentHTML('beforeend', addressLine);
    });
  }

  private setUserProfileInfo(): void {
    const { firstName, lastName, dateOfBirth, email } = this.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = CssClasses;

    setElementTextContent(classSelector(FIRST_NAME), this, firstName);
    setElementTextContent(classSelector(LAST_NAME), this, lastName);
    setElementTextContent(classSelector(DATE_OF_BIRTH), this, dateOfBirth);
    setElementTextContent(classSelector(EMAIL), this, email);
  }

  private setPasswordLengthDisplay(): void {
    const { password } = this.customer;
    const { PASSWORD } = CssClasses;
    const length = password?.length as number;
    setElementTextContent(classSelector(PASSWORD), this, PASSWORD_DOT.repeat(length));
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      this.customer;
    const lines = this.$$(classSelector(CssClasses.ADDRESS_LINE));
    lines.forEach((line, rowIndex) => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const { STREET, CITY, POSTAL_CODE, COUNTRY, TYPE_OF_ADDRESS, ADDRESS_BOX } = CssClasses;
      const addressTypeContainer = <HTMLDivElement>line.querySelector(classSelector(TYPE_OF_ADDRESS));
      const addressContainer = <HTMLDivElement>line.querySelector(classSelector(ADDRESS_BOX));
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
      setElementTextContent(classSelector(STREET), line, streetName);
      setElementTextContent(classSelector(CITY), line, city);
      setElementTextContent(classSelector(POSTAL_CODE), line, postalCode);
      setElementTextContent(classSelector(COUNTRY), line, country);
      UserProfile.setAddressTypes(addressTypeContainer, addressTypes);
    });
  }

  private static setAddressTypes(container: HTMLDivElement, addressTypes: string[]): void {
    addressTypes.forEach((type) => {
      [...container.children].find((child) => child.classList.contains(type))?.classList.remove(CssClasses.HIDDEN);
    });
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
    this.isAddressAction = true;
    this.isAddressDeleting = true;
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(classSelector(CssClasses.CONTAINER)) as HTMLDivElement;
    this.addressId = fieldContainer.id;
    this.template = deleteTemplate;
    this.setModalContent(SubmitBtnValue.DELETE, true);
    this.showModalWindow();
  }

  private enableEditAddressMode(event: Event): void {
    this.isAddressAction = true;
    this.isAddressEditing = true;
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(classSelector(CssClasses.CONTAINER)) as HTMLDivElement;
    this.addressId = fieldContainer.id;
    this.template = addressTemplate;
    this.setModalContent(SubmitBtnValue.SAVE, false, ADDRESS_TITLE.EDIT);
    this.showModalWindow();
  }

  private enableAddNewAddressMode(): void {
    this.isAddressAction = true;
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
    this.isDefaultBillingAddressChanged = false;
    this.isDefaultShippingAddressChanged = false;
    this.isAddressAction = false;
    this.isAddressUpdating = false;
    this.addressId = '';
    this.checkboxState = {
      billing: false,
      shipping: false,
      defaultBilling: false,
      defaultShipping: false,
    };
  }

  private setCallback(): void {
    const { NAME_BOX, WRAPPER_WRITE, PASSWORD_BOX, OVERLAY, ADD_BUTTON_BOX, SUBMIT_BUTTON } = CssClasses;
    const writeProfileInfoBox = this.$(`${classSelector(NAME_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const writePasswordBox = this.$(`${classSelector(PASSWORD_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const overlay = this.$(classSelector(OVERLAY));
    const addButton = this.$(classSelector(ADD_BUTTON_BOX));
    const submitBtn = this.$(classSelector(SUBMIT_BUTTON));

    writeProfileInfoBox?.addEventListener('click', this.enableEditProfileInfoMode.bind(this));
    writePasswordBox?.addEventListener('click', this.enableChangePasswordMode.bind(this));
    overlay?.addEventListener('click', this.closeModalWindow.bind(this));
    addButton?.addEventListener('click', this.enableAddNewAddressMode.bind(this));
    submitBtn?.addEventListener('click', this.submit.bind(this));
  }

  private createValidator(): void {
    const { INPUT, SUBMIT_BUTTON } = CssClasses;
    const inputs = <HTMLInputElement[]>this.$$(classSelector(INPUT));
    const submitBtn = <HTMLInputElement>this.$(classSelector(SUBMIT_BUTTON));
    this.validator = new Validator(inputs, submitBtn);
  }

  private setAddressIconsCallback(): void {
    const { ADDRESS_BOX, WRAPPER_WRITE, WRAPPER_DELETE } = CssClasses;
    const writeAddressBoxes = this.$$(`${classSelector(ADDRESS_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const deleteBoxes = this.$$(classSelector(WRAPPER_DELETE));

    writeAddressBoxes.forEach((box) => box.addEventListener('click', this.enableEditAddressMode.bind(this)));
    deleteBoxes.forEach((box) => box.addEventListener('click', this.enableDeleteAddressMode.bind(this)));
  }

  private setCheckboxCallback(): void {
    const { DEFAULT_BILLING, DEFAULT_SHIPPING, BILLING_COUNTRY, SHIPPING_COUNTRY } = InputID;
    const defaultBillingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_BILLING));
    const defaultShippingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_SHIPPING));
    const billingCheckbox = <HTMLInputElement>this.$(idSelector(BILLING_COUNTRY));
    const shippingCheckbox = <HTMLInputElement>this.$(idSelector(SHIPPING_COUNTRY));
    if (this.isAddressAdding) {
      [defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
          const target = event.target as HTMLInputElement;
          if (target.checked) {
            makeCheckboxChecked(idSelector(target.className));
          }
        });
      });
    }
    if (this.isAddressEditing) {
      [billingCheckbox, shippingCheckbox, defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          enableInput(classSelector(CssClasses.SUBMIT_BUTTON));
        });
      });
    }
  }

  private showModalWindow(): void {
    const modal = this.$(classSelector(CssClasses.OVERLAY));
    modal?.classList.remove(CssClasses.HIDDEN);
  }

  private closeModalWindow(event: Event): void {
    const target: HTMLDivElement = event.target as HTMLDivElement;
    const { OVERLAY, ICON_BOX, ICON } = CssClasses;
    if (
      !target.classList.contains(OVERLAY) &&
      !target.classList.contains(ICON_BOX) &&
      !target.classList.contains(ICON)
    ) {
      return;
    }
    this.hideModalWindow();
  }

  private hideModalWindow(): void {
    const modal = this.$(classSelector(CssClasses.OVERLAY));
    modal?.classList.add(CssClasses.HIDDEN);
    this.disableEditMode();
  }

  private setModalContent(submitButtonValue: string, isButtonEnabled: boolean, title?: string): void {
    const { MODAL, SUBMIT_BUTTON } = CssClasses;
    this.clearContent(classSelector(MODAL));
    const contentBox = this.$(classSelector(MODAL));

    if (title) {
      contentBox?.insertAdjacentHTML('afterbegin', title);
    }

    if (isButtonEnabled) {
      enableInput(classSelector(SUBMIT_BUTTON));
    } else {
      disableInput(classSelector(SUBMIT_BUTTON));
    }

    setInputValue(classSelector(SUBMIT_BUTTON), submitButtonValue);
    contentBox?.insertAdjacentHTML('beforeend', this.template);
    this.fillTemplate();
  }

  private clearContent(selector: string): void {
    const contentBox = this.$(selector);
    if (contentBox) {
      while (contentBox.firstElementChild) {
        contentBox.firstElementChild.remove();
      }
    }
  }

  private fillTemplate(): void {
    if (this.isAddressEditing) {
      this.fillAddressTemplate();
      this.setCheckboxCallback();
    }
    if (this.isProfileEditing) {
      this.fillPersonalTemplate();
    }
    if (this.isAddressDeleting) {
      this.fillDeleteTemplate();
      return;
    }
    if (this.isAddressAdding) {
      this.setCheckboxCallback();
    }
    this.createValidator();
  }

  private fillAddressTemplate(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      this.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const { STREET, CITY, POSTAL_CODE, SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    setInputValue(idSelector(STREET), streetName);
    setInputValue(idSelector(CITY), city);
    setInputValue(idSelector(POSTAL_CODE), postalCode);
    if (this.addressId === defaultShippingAddressId) {
      makeCheckboxChecked(idSelector(DEFAULT_SHIPPING));
      this.checkboxState.defaultShipping = true;
    }
    if (this.addressId === defaultBillingAddressId) {
      makeCheckboxChecked(idSelector(DEFAULT_BILLING));
      this.checkboxState.defaultBilling = true;
    }
    if (shippingAddressIds?.includes(this.addressId)) {
      makeCheckboxChecked(idSelector(SHIPPING_COUNTRY));
      this.checkboxState.shipping = true;
    }
    if (billingAddressIds?.includes(this.addressId)) {
      makeCheckboxChecked(idSelector(BILLING_COUNTRY));
      this.checkboxState.billing = true;
    }
  }

  private fillPersonalTemplate(): void {
    const { firstName, lastName, dateOfBirth, email } = this.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    setInputValue(idSelector(FIRST_NAME), firstName);
    setInputValue(idSelector(LAST_NAME), lastName);
    setInputValue(idSelector(DATE_OF_BIRTH), dateOfBirth);
    setInputValue(idSelector(EMAIL), email);
  }

  private fillDeleteTemplate(): void {
    const { addresses } = this.customer;
    const addressToDelete = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode, country } = addressToDelete;
    const { STREET, CITY, POSTAL_CODE, COUNTRY, DELETE_BOX } = CssClasses;
    const container = <HTMLDivElement>this.$(classSelector(DELETE_BOX));
    setElementTextContent(classSelector(STREET), container, streetName);
    setElementTextContent(classSelector(CITY), container, city);
    setElementTextContent(classSelector(POSTAL_CODE), container, postalCode);
    setElementTextContent(classSelector(COUNTRY), container, country);
  }

  private submit(): void {
    if (this.isProfileEditing) {
      this.submitProfileInfo();
    }
    if (this.isPasswordChanging) {
      this.submitNewPassword();
    }
    if (this.isAddressAdding) {
      this.submitNewAddress();
    }
    if (this.isAddressEditing) {
      this.submitAddressChanges();
    }
    if (this.isAddressDeleting) {
      this.removeAddress();
    }
  }

  private submitProfileInfo(): void {
    const { firstName, lastName, dateOfBirth, email } = this.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    const newFirstName = getInputValue(idSelector(FIRST_NAME));
    const newLastName = getInputValue(idSelector(LAST_NAME));
    const newDateOfBirth = getInputValue(idSelector(DATE_OF_BIRTH));
    const newEmail = getInputValue(idSelector(EMAIL));
    const { version } = this.customer;
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
    this.updateUserProfile({ version, actions });
  }

  private submitNewPassword(): void {
    const { NEW_PASSWORD, OLD_PASSWORD, RE_ENTERED_PASSWORD } = InputID;
    const { version } = this.customer;
    const currentPassword = getInputValue(idSelector(OLD_PASSWORD));
    const newPassword = getInputValue(idSelector(NEW_PASSWORD));
    const reenteredPassword = getInputValue(idSelector(RE_ENTERED_PASSWORD));
    if (newPassword !== reenteredPassword) {
      const message = ErrorMessages.PASSWORD_MISMATCH.password;
      const { validator } = this;
      validator?.setErrorMessage(NEW_PASSWORD, message);
      validator?.setErrorMessage(RE_ENTERED_PASSWORD, message);
      validator?.showErrorMessage(NEW_PASSWORD);
      validator?.showErrorMessage(RE_ENTERED_PASSWORD);
      validator?.setSubmitButtonState();
      return;
    }
    this.changeUserPassword({ version, currentPassword, newPassword });
  }

  private submitNewAddress(): void {
    const { STREET, CITY, POSTAL_CODE } = InputID;
    const streetName = getInputValue(idSelector(STREET));
    const city = getInputValue(idSelector(CITY));
    const postalCode = getInputValue(idSelector(POSTAL_CODE));
    const country = Country.UnitedStates;
    const { version } = this.customer;
    const actions: MyCustomerUpdateAction[] = [
      {
        action: UpdateActions.ADD_ADDRESS,
        address: {
          streetName,
          city,
          postalCode,
          country,
        },
      },
    ];
    this.updateUserProfile({ version, actions });
  }

  private submitAddressChanges(): void {
    const { STREET, CITY, POSTAL_CODE } = InputID;
    const { addresses } = this.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const newStreetName = getInputValue(idSelector(STREET));
    const newCity = getInputValue(idSelector(CITY));
    const newPostalCode = getInputValue(idSelector(POSTAL_CODE));
    const country = Country.UnitedStates;
    const { version } = this.customer;
    if (streetName !== newStreetName || city !== newCity || postalCode !== newPostalCode) {
      const actions: MyCustomerUpdateAction[] = [
        {
          action: UpdateActions.CHANGE_ADDRESS,
          addressId: this.addressId,
          address: {
            streetName: newStreetName,
            city: newCity,
            postalCode: newPostalCode,
            country,
          },
        },
      ];
      this.updateUserProfile({ version, actions });
    } else {
      this.isAddressEditing = false;
      this.setAddressUpdateActions();
      if (this.addressUpdateActions.length !== 0) {
        this.submitUpdateActions();
      }
    }
  }

  private submitUpdateActions(): void {
    const { version } = this.customer;
    const actions = this.addressUpdateActions;
    this.updateUserProfile({ version, actions });
  }

  private removeAddress(): void {
    const { version } = this.customer;
    const actions: MyCustomerUpdateAction[] = [
      {
        action: UpdateActions.REMOVE_ADDRESS,
        addressId: this.addressId,
      },
    ];
    this.updateUserProfile({ version, actions });
  }

  private setNewAddressActions(): void {
    this.addressUpdateActions = [];
    this.isAddressUpdating = true;
    const { addresses } = this.customer;
    this.addressId = addresses[addresses.length - 1].id as string;
    const { addressId } = this;
    const { SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    const setAsShipping = getCheckboxState(idSelector(SHIPPING_COUNTRY));
    const setAsBilling = getCheckboxState(idSelector(BILLING_COUNTRY));
    const setAsDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const setAsDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));
    if (setAsShipping) {
      this.addressUpdateActions.push({
        action: UpdateActions.ADD_SHIPPING_ADDRESS_ID,
        addressId,
      });
    }
    if (setAsBilling) {
      this.addressUpdateActions.push({
        action: UpdateActions.ADD_BILLING_ADDRESS_ID,
        addressId,
      });
    }
    if (setAsDefaultShipping) {
      this.isDefaultShippingAddressChanged = true;
      this.addressUpdateActions.push({
        action: UpdateActions.SET_DEFAULT_SHIPPING_ADDRESS,
        addressId,
      });
    }
    if (setAsDefaultBilling) {
      this.isDefaultBillingAddressChanged = true;
      this.addressUpdateActions.push({
        action: UpdateActions.SET_DEFAULT_BILLING_ADDRESS,
        addressId,
      });
    }
  }

  private setAddressUpdateActions(): void {
    this.addressUpdateActions = [];
    this.isAddressUpdating = true;
    const { addressId } = this;
    const { SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    const setAsShipping = getCheckboxState(idSelector(SHIPPING_COUNTRY));
    const setAsBilling = getCheckboxState(idSelector(BILLING_COUNTRY));
    const setAsDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const setAsDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));
    if (setAsShipping !== this.checkboxState.shipping) {
      const action = setAsShipping ? UpdateActions.ADD_SHIPPING_ADDRESS_ID : UpdateActions.REMOVE_SHIPPING_ADDRESS_ID;
      this.addressUpdateActions.push({ action, addressId });
    }
    if (setAsBilling !== this.checkboxState.billing) {
      const action = setAsBilling ? UpdateActions.ADD_BILLING_ADDRESS_ID : UpdateActions.REMOVE_BILLING_ADDRESS_ID;
      this.addressUpdateActions.push({ action, addressId });
    }
    if (setAsDefaultShipping !== this.checkboxState.defaultShipping) {
      const action = UpdateActions.SET_DEFAULT_SHIPPING_ADDRESS;
      const id = setAsDefaultShipping ? addressId : undefined;
      this.isDefaultShippingAddressChanged = setAsDefaultShipping;
      this.addressUpdateActions.push({ action, addressId: id });
    }
    if (setAsDefaultBilling !== this.checkboxState.defaultBilling) {
      const action = UpdateActions.SET_DEFAULT_BILLING_ADDRESS;
      const id = setAsDefaultBilling ? addressId : undefined;
      this.isDefaultBillingAddressChanged = setAsDefaultBilling;
      this.addressUpdateActions.push({ action, addressId: id });
    }
  }

  private updateUserProfile(user: MyCustomerUpdate): void {
    update(user)
      .then(({ body }) => {
        Store.customer = body;
        this.customer = body;
        this.handleSubmitActionResult();
      })
      .catch(() => UserProfile.showMessage(ToastMessage.ERROR, false));
  }

  private changeUserPassword(requestBody: MyCustomerChangePassword): void {
    changePassword(requestBody)
      .then(({ body }) => {
        Store.customer = body;
        this.customer = body;
        logout();
        this.logIn(requestBody.newPassword);
        UserProfile.showMessage(ToastMessage.PASSWORD_CHANGED, true);
        this.setPasswordLengthDisplay();
        this.hideModalWindow();
      })
      .catch((error: ErrorResponse) => {
        UserProfile.showMessage(error.message, false);
        this.validator?.setErrorMessage(InputID.OLD_PASSWORD, error.message);
        this.validator?.showErrorMessage(InputID.OLD_PASSWORD);
        this.validator?.setSubmitButtonState();
      });
  }

  private handleSubmitActionResult(): void {
    if (this.isProfileEditing) {
      this.setUserProfileInfo();
      UserProfile.showMessage(ToastMessage.INFO_UPDATED, true);
    }
    if (this.isAddressAction) {
      if (this.isAddressAdding) {
        UserProfile.showMessage(ToastMessage.ADDRESS_SAVED, true);
        this.isAddressAdding = false;
        this.setNewAddressActions();
        if (this.addressUpdateActions.length !== 0) {
          this.submitUpdateActions();
          return;
        }
      }
      if (this.isAddressDeleting) {
        UserProfile.showMessage(ToastMessage.ADDRESS_REMOVED, true);
      }
      if (this.isAddressEditing) {
        UserProfile.showMessage(ToastMessage.ADDRESS_CHANGED, true);
        this.isAddressEditing = false;
        this.setAddressUpdateActions();
        if (this.addressUpdateActions.length !== 0) {
          this.submitUpdateActions();
          return;
        }
      }
      if (this.isAddressUpdating) {
        if (this.isDefaultBillingAddressChanged) {
          UserProfile.showMessage(ToastMessage.DEFAULT_BILLING_ADDRESS_CHANGED, true);
        }
        if (this.isDefaultShippingAddressChanged) {
          UserProfile.showMessage(ToastMessage.DEFAULT_SHIPPING_ADDRESS_CHANGED, true);
        }
        UserProfile.showMessage(ToastMessage.ADDRESS_CHANGED, true);
      }
      this.renderAddress();
    }
    this.hideModalWindow();
  }

  private static showMessage(message: string, isResultOk: boolean): void {
    const props: Options = isResultOk
      ? getToastOptions(message, ToastBackground.GREEN)
      : getToastOptions(message, ToastBackground.RED);
    Toastify(props).showToast();
  }

  private logIn(password: string): void {
    const { email } = this.customer;
    login(email, password).then().catch(console.error);
  }
}
