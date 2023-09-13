import './registration.scss';
import { BaseAddress, ErrorResponse } from '@commercetools/platform-sdk';
import html from './registration.html';
import Page from '../Page';
import CssClasses from './css-classes';
import { registration } from '../../services/API';
import InputID from '../../enums/input-id';
import successIcon from '../../assets/icons/success.svg';
import errorIcon from '../../assets/icons/error.svg';
import { ServerErrors, errorMessages } from '../../types/errors';
import { classSelector, idSelector, pause } from '../../utils/create-element';
import Store from '../../services/Store';
import NewUser from '../../services/NewUser';
import AddressType from '../../enums/address-type';
import Router from '../../services/Router';
import { Country } from '../../config';
import { disableInput, enableInput, getCheckboxState, getInputValue } from '../../utils/service-functions';
import Validator from '../../services/Validator';
import loginUser from '../../utils/login';

Router.registerRoute('registration', 'registration-page');

const REDIRECT_DELAY = 3000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML = {
  ALREADY: `
  <p>Looks like you already have an account. You will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`,
  SUCCESS: `<p>You will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`,
};

export default class RegistrationPage extends Page {
  private isSignUp: boolean = false;

  private validator: Validator | undefined = undefined;

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
    this.setCallback();
    this.createValidator();
  }

  private setCallback(): void {
    const { CHECKBOX, LOGIN_BTN, SELECT, OVERLAY, SUBMIT_BUTTON } = CssClasses;

    const submitButton = <HTMLInputElement>this.$(classSelector(SUBMIT_BUTTON));
    submitButton.addEventListener('click', this.submit.bind(this));

    const sameAddressCheckbox = <HTMLInputElement>this.$(idSelector(CHECKBOX));
    sameAddressCheckbox.addEventListener('change', this.setShippingAsBilling.bind(this));

    const loginButton = <HTMLInputElement>this.$(classSelector(LOGIN_BTN));
    loginButton.addEventListener('click', () => {
      window.location.href = '#login';
    });

    const countryFileds = <HTMLInputElement[]>this.$$('[name="country"]');
    countryFileds.forEach((field) => {
      field.addEventListener('focus', this.showCountryList.bind(this));
      field.addEventListener('input', this.showCountryList.bind(this));
    });

    const countrySelects = <HTMLDivElement[]>this.$$(classSelector(SELECT));
    countrySelects.forEach((select) => select.addEventListener('click', this.hideCountryList.bind(this)));

    const overlay = this.$(classSelector(OVERLAY));
    overlay?.addEventListener('click', this.closeModalWindow.bind(this));

    this.addEventListener('click', this.closeCountryList.bind(this));
  }

  private createValidator(): void {
    const { INPUT, SUBMIT_BUTTON } = CssClasses;
    const inputs = <HTMLInputElement[]>this.$$(classSelector(INPUT));
    const submitBtn = <HTMLInputElement>this.$(classSelector(SUBMIT_BUTTON));
    this.validator = new Validator(inputs, submitBtn);
  }

  private showCountryList(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.value || target.value.trim() !== 'United States') {
      const selector = target.id;
      const countrySelect = this.$(`${classSelector(CssClasses.SELECT)}${classSelector(selector)}`);
      if (countrySelect) {
        countrySelect.classList.remove(CssClasses.HIDDEN);
        countrySelect.style.top = `${target.getBoundingClientRect().bottom + window.scrollY}px`;
      }
    }
  }

  private hideCountryList(event: Event): void {
    const target = event.target as HTMLDivElement;
    const selector = Object.values(InputID).find((id) => target.classList.contains(id));
    const field = <HTMLInputElement>this.$(`#${selector}`);
    if (field) {
      field.value = target.textContent as string;
      field.dispatchEvent(new Event('input'));
    }
    target.classList.add(CssClasses.HIDDEN);
  }

  private handleErrorResponse(error: ErrorResponse): void {
    if (Object.values(ServerErrors).includes(error.statusCode)) {
      const message = 'Something went wrong. Try again later';
      this.showRegistrationResult(message);
      return;
    }
    if (error.message === errorMessages.dataError) {
      const message = 'Please fill out all required fields and try again';
      this.showRegistrationResult(message);
      return;
    }
    if (error.message === errorMessages.emailError) {
      const email = this.$(idSelector(InputID.EMAIL));
      email?.classList.add(CssClasses.ERROR);
    }
    this.showRegistrationResult(error.message);
  }

  private showRegistrationResult(message: string): void {
    const { OVERLAY, ICON, MESSAGE, HIDDEN } = CssClasses;
    const overlay = this.$(classSelector(OVERLAY));
    const iconBox = <HTMLImageElement>this.$(classSelector(ICON));
    const messageBox = <HTMLDivElement>this.$(classSelector(MESSAGE));
    if (iconBox && messageBox) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      iconBox.src = this.isSignUp ? successIcon : errorIcon;
      messageBox.textContent = message;
      overlay?.classList.remove(HIDDEN);
      document.body.classList.add(CssClasses.HAS_MODAL);
    }
  }

  private static setAddress(addressType: AddressType): BaseAddress {
    const STREET = InputID[`${addressType}_STREET`];
    const CITY = InputID[`${addressType}_CITY`];
    const POSTAL_CODE = InputID[`${addressType}_CODE`];
    const address: BaseAddress = {
      streetName: getInputValue(idSelector(STREET)),
      city: getInputValue(idSelector(CITY)),
      postalCode: getInputValue(idSelector(POSTAL_CODE)),
      country: Country.UnitedStates,
    };
    return address;
  }

  private setCustomerInformation(): void {
    const { FIRST_NAME, LAST_NAME, EMAIL, PASSWORD, DATE_OF_BIRTH, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    this.customer.firstName = getInputValue(idSelector(FIRST_NAME));
    this.customer.lastName = getInputValue(idSelector(LAST_NAME));
    this.customer.email = getInputValue(idSelector(EMAIL));
    this.customer.password = getInputValue(idSelector(PASSWORD));
    this.customer.dateOfBirth = getInputValue(idSelector(DATE_OF_BIRTH));

    const shippingAddress: BaseAddress = RegistrationPage.setAddress(AddressType.SHIPPING);
    const billingAddress: BaseAddress = RegistrationPage.setAddress(AddressType.BILLING);
    this.customer.addresses = [shippingAddress, billingAddress];
    const indexOfShipping: number = this.customer.addresses.indexOf(shippingAddress);
    let indexOfBilling: number = this.customer.addresses.indexOf(billingAddress);

    const setAsDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const setAsDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));
    this.customer.defaultShippingAddress = setAsDefaultShipping ? indexOfShipping : undefined;
    this.customer.defaultBillingAddress = setAsDefaultBilling ? indexOfBilling : undefined;

    if (this.isShippingAsBilling) {
      this.customer.addresses = [shippingAddress];
      indexOfBilling = indexOfShipping;
      this.customer.defaultBillingAddress = setAsDefaultBilling ? indexOfBilling : undefined;
    }
    this.customer.shippingAddresses = [indexOfShipping];
    this.customer.billingAddresses = [indexOfBilling];
  }

  private register(): void {
    registration(this.customer)
      .then((response) => {
        this.isSignUp = true;
        const { customer } = response.body;
        if (customer.firstName && customer.lastName) {
          const message = `Thanks for signing up, ${customer.firstName} ${customer.lastName}. Your account has been created.`;
          this.showRegistrationResult(message);
        }
        this.logIn();
      })
      .catch((error: ErrorResponse) => {
        this.isSignUp = false;
        this.handleErrorResponse(error);
      });
  }

  private submit(): void {
    RegistrationPage.disableButtons();
    this.setCustomerInformation();
    this.register();
  }

  private setShippingAsBilling(event: Event): void {
    this.isShippingAsBilling = true;
    const { SHIPPING, BILLING } = CssClasses;
    const shippingFileds = <HTMLInputElement[]>this.$$(classSelector(SHIPPING));
    const billingFileds = <HTMLInputElement[]>this.$$(classSelector(BILLING));
    const target = event.target as HTMLInputElement;
    shippingFileds.forEach((field: HTMLInputElement, index: number): void => {
      billingFileds[index].value = target.checked ? field.value : '';
    });
    billingFileds.forEach((field: HTMLInputElement): void => {
      this.validator?.hideErrorMessage(field.id);
      this.validator?.setSubmitButtonState();
    });
  }

  private closeCountryList(event: Event): void {
    const { SELECT, HIDDEN } = CssClasses;
    const countrySelects = <HTMLDivElement[]>this.$$(classSelector(SELECT));
    countrySelects.forEach((select) => {
      if (
        !select.classList.contains(HIDDEN) &&
        !(event.target instanceof HTMLInputElement && event.target.name === 'country')
      ) {
        select.classList.add(HIDDEN);
      }
    });
  }

  private closeModalWindow(event: Event): void {
    const target: HTMLDivElement = event.target as HTMLDivElement;
    const { OVERLAY, POP_UP_ICON_BOX, ICON } = CssClasses;
    if (
      !target.classList.contains(OVERLAY) &&
      !target.classList.contains(POP_UP_ICON_BOX) &&
      !target.classList.contains(ICON)
    ) {
      return;
    }
    this.hideModalWindow();
  }

  private hideModalWindow(): void {
    const { OVERLAY, HIDDEN, HAS_MODAL } = CssClasses;
    const modal = this.$(classSelector(OVERLAY));
    modal?.classList.add(HIDDEN);
    document.body.classList.remove(HAS_MODAL);
    RegistrationPage.enableButtons();
    if (this.isSignUp) {
      this.goToMainPage(HTML.SUCCESS).catch(console.error);
    }
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

  private static disableButtons(): void {
    const { SUBMIT_BUTTON, LOGIN_BTN } = CssClasses;
    disableInput(classSelector(SUBMIT_BUTTON));
    disableInput(classSelector(LOGIN_BTN));
  }

  private static enableButtons(): void {
    const { SUBMIT_BUTTON, LOGIN_BTN } = CssClasses;
    enableInput(classSelector(SUBMIT_BUTTON));
    enableInput(classSelector(LOGIN_BTN));
  }
}
