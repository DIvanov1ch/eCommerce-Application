import './registration.scss';
import { BaseAddress, ErrorResponse } from '@commercetools/platform-sdk';
import html from './registration.html';
import Page from '../Page';
import CssClasses from './css-classes';
import { registerCustomer } from '../../services/API';
import InputID from '../../enums/input-id';
import { ServerErrors, errorMessages } from '../../types/errors';
import { classSelector, idSelector, pause } from '../../utils/create-element';
import Store from '../../services/Store';
import NewUser from '../../services/NewUser';
import Router from '../../services/Router';
import { Country } from '../../config';
import { disableInput, enableInput, getCheckboxState } from '../../utils/service-functions';
import loginUser from '../../utils/login';
import NameField from '../../components/InputField/NameField';
import EmailField from '../../components/InputField/EmailField';
import PasswordField from '../../components/InputField/PasswordField';
import DateOfBirthField from '../../components/InputField/DateOfBirthField';
import StreetField from '../../components/InputField/StreetField';
import CityField from '../../components/InputField/CityField';
import PostalCodeField from '../../components/InputField/PostalCodeField';
import CountryField from '../../components/InputField/CountryField';
import FormValidator from '../../services/FormValidator';
import throwError from '../../utils/throw-error';
import { TypeOfAddress } from '../../types';
import InputField from '../../components/InputField';
import showToastMessage from '../../utils/show-toast-message';

Router.registerRoute('registration', 'registration-page');

const REDIRECT_DELAY = 3000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML = {
  ALREADY: `
  <p>Looks like you already have an account. You will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`,
  SUCCESS: `<p>You will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`,
};

const ResponseMessage = {
  ServerError: 'Something went wrong. Try again later',
  MissingField: 'Please fill out all required fields and try again',
  SuccessfulRegistration: `Thanks for signing up. Your account has been created.`,
};

export default class RegistrationPage extends Page {
  private personalDetails: InputField[] = [];

  private billingAddress: InputField[] = [];

  private shippingAddress: InputField[] = [];

  private validator!: FormValidator;

  private customer = new NewUser();

  private isShippingAsBilling: boolean = false;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    if (Store.customer) {
      this.goToMainPage(HTML.ALREADY).then().catch(console.error);
      return;
    }
    super.connectedCallback();
    this.renderPersonalDetailsFields();
    this.renderAddressFields('shipping');
    this.renderAddressFields('billing');
    this.setCallback();
    this.validator = new FormValidator(this.$(classSelector(CssClasses.FORM)) || this);
  }

  private createPersonalDetails(): void {
    const firstNameField = new NameField('firstName');
    const lastNameField = new NameField('lastName');
    const emailField = new EmailField();
    const passwordField = new PasswordField();
    const dateOfBirthField = new DateOfBirthField();
    this.personalDetails.push(firstNameField, lastNameField, emailField, passwordField, dateOfBirthField);
  }

  private renderPersonalDetailsFields(): void {
    this.createPersonalDetails();
    const { PERSONAL_DETAILS } = CssClasses;
    const container = this.$(classSelector(PERSONAL_DETAILS));
    if (container === null) {
      throwError(new Error(`${PERSONAL_DETAILS} is 'null`));
      return;
    }
    this.personalDetails.forEach((component) => {
      container.insertAdjacentElement('beforeend', component);
    });
  }

  private createAddress(typeOfAddress: TypeOfAddress): void {
    const streetField = new StreetField(typeOfAddress);
    const cityField = new CityField(typeOfAddress);
    const postalCodeField = new PostalCodeField(typeOfAddress);
    const countryField = new CountryField(typeOfAddress);
    this[`${typeOfAddress}Address`].push(streetField, cityField, postalCodeField, countryField);
  }

  private renderAddressFields(typeOfAddress: TypeOfAddress): void {
    this.createAddress(typeOfAddress);
    const { SHIPPING_ADDRESS, BILLING_ADDRESS } = CssClasses;
    const selector = typeOfAddress === 'billing' ? BILLING_ADDRESS : SHIPPING_ADDRESS;
    const container = this.$(classSelector(selector));
    this[`${typeOfAddress}Address`].forEach((field) => {
      container?.insertAdjacentElement('beforeend', field);
    });
  }

  private setCallback(): void {
    const { CHECKBOX, LOGIN_BTN, SUBMIT_BUTTON } = CssClasses;

    const submitButton = this.$<'input'>(classSelector(SUBMIT_BUTTON));
    submitButton?.addEventListener('click', this.submit.bind(this));

    const shippingAsBillingCheckbox = this.$<'input'>(idSelector(CHECKBOX));
    shippingAsBillingCheckbox?.addEventListener('change', this.setShippingAsBilling.bind(this));

    const loginButton = this.$<'input'>(classSelector(LOGIN_BTN));
    loginButton?.addEventListener('click', () => {
      window.location.href = '#login';
    });
  }

  private submit(): void {
    const { SUBMIT_BUTTON, LOGIN_BTN } = CssClasses;
    [SUBMIT_BUTTON, LOGIN_BTN].forEach((btn) => disableInput(classSelector(btn)));
    this.setPersonalDetails();
    this.setAddresses();
    this.register();
  }

  private setShippingAsBilling(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.checked) {
      this.isShippingAsBilling = true;
      this.billingAddress.forEach((field, index) => {
        field.setInputValue(this.shippingAddress[index].getInputValue());
        field.disableInput();
        field.checkValue();
      });
      this.shippingAddress.forEach((field, index) => {
        field.pipe(this.billingAddress[index]);
      });
    } else {
      this.isShippingAsBilling = false;
      this.billingAddress.forEach((field) => {
        field.enableInput();
      });
      this.shippingAddress.forEach((field) => {
        field.unpipe();
      });
    }
    this.validator.changeButtonState();
  }

  private setPersonalDetails(): void {
    [
      this.customer.firstName,
      this.customer.lastName,
      this.customer.email,
      this.customer.password,
      this.customer.dateOfBirth,
    ] = this.personalDetails.map((field) => field.getInputValue());
  }

  private setAddresses(): void {
    const { DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    const billingAddress: BaseAddress = this.getAddress('billing');
    const shippingAddress: BaseAddress = this.getAddress('shipping');
    this.customer.addresses = this.isShippingAsBilling ? [shippingAddress] : [shippingAddress, billingAddress];

    const indexOfShipping = this.customer.addresses.indexOf(shippingAddress);
    const indexOfBilling = this.isShippingAsBilling ? indexOfShipping : this.customer.addresses.indexOf(billingAddress);
    const isDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const isDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));

    this.customer.defaultShippingAddress = isDefaultShipping ? indexOfShipping : undefined;
    this.customer.defaultBillingAddress = isDefaultBilling ? indexOfBilling : undefined;

    this.customer.shippingAddresses = [indexOfShipping];
    this.customer.billingAddresses = [indexOfBilling];
  }

  private getAddress(typeOfAddress: TypeOfAddress): BaseAddress {
    const [streetName, city, postalCode] = this[`${typeOfAddress}Address`].map((field) => field.getInputValue());
    const country = Country.UnitedStates;
    const address: BaseAddress = { streetName, city, postalCode, country };
    return address;
  }

  private register(): void {
    registerCustomer(this.customer)
      .then(() => {
        showToastMessage(ResponseMessage.SuccessfulRegistration, true);
        this.goToMainPage(HTML.SUCCESS).catch(console.error);
        this.logIn();
      })
      .catch((error: ErrorResponse) => {
        this.handleErrorResponse(error);
        const { SUBMIT_BUTTON, LOGIN_BTN } = CssClasses;
        [SUBMIT_BUTTON, LOGIN_BTN].forEach((btn) => enableInput(classSelector(btn)));
      });
  }

  private handleErrorResponse(error: ErrorResponse): void {
    let message = '';
    if (Object.values(ServerErrors).includes(error.statusCode)) {
      message = ResponseMessage.ServerError;
    }
    if (error.message === errorMessages.dataError) {
      message = ResponseMessage.MissingField;
    }
    if (error.message === errorMessages.emailError) {
      message = error.message;
      const emailField = this.personalDetails.find((field) => field instanceof EmailField);
      emailField?.setWarning({ emptyField: '', invalidValue: message });
      emailField?.displayWarning();
    }
    showToastMessage(message, false);
  }

  private logIn(): void {
    loginUser(this.customer.email, this.customer.password).catch(console.error);
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#');
    }
  }
}
