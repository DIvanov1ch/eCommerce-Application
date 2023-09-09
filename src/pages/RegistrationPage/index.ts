import './registration.scss';
import { BaseAddress, ErrorResponse } from '@commercetools/platform-sdk';
import html from './registration.html';
import Page from '../Page';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';
import CssClasses from './css-classes';
import { login, logout, registration } from '../../services/API';
import InputID from '../../enums/input-id';
import successIcon from '../../assets/icons/success.svg';
import errorIcon from '../../assets/icons/error.svg';
import { ServerErrors, errorMessages } from '../../types/errors';
import warningIcon from '../../assets/icons/warning-icon.png';
import { classSelector, idSelector, pause } from '../../utils/create-element';
import Store from '../../services/Store';
import NewUser from '../../services/NewUser';
import AddressType from '../../enums/address-type';
import Router from '../../services/Router';

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

  private fields: NodeListOf<HTMLInputElement> = this.querySelectorAll(`.${CssClasses.INPUT_FIELD}`);

  private customer = new NewUser();

  private country = 'US';

  private isShippingAsBilling: boolean = false;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
    this.fields = this.querySelectorAll(classSelector(CssClasses.INPUT_FIELD));
    this.setCallback();
  }

  private setCallback(): void {
    const { SUBMIT_BTN, FORM, CHECKBOX, LOGIN_BTN, SELECT } = CssClasses;
    this.fields.forEach((field: HTMLInputElement): void => {
      field.addEventListener('input', this.hideError.bind(this));
      field.addEventListener('invalid', (event: Event) => event.preventDefault());
    });

    const submitButton = <HTMLInputElement>this.$(classSelector(SUBMIT_BTN));
    submitButton.addEventListener('click', this.checkValuesBeforeSubmit.bind(this));

    const form = <HTMLFormElement>this.$(classSelector(FORM));
    form.addEventListener('submit', (event: Event) => event.preventDefault());

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

    this.addEventListener('click', this.hidePopupAndRedirect.bind(this));
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

  private getInvalidFields(): HTMLInputElement[] {
    const invalidFields: HTMLInputElement[] = [...this.fields].filter(
      (field: HTMLInputElement): boolean => !isValidValue(field.id, field.value.trim())
    );
    return invalidFields;
  }

  private hideError(event: Event): void;
  private hideError(field: HTMLInputElement): void;
  private hideError(eventOrInput: Event | HTMLInputElement): void {
    const target: HTMLInputElement =
      eventOrInput instanceof Event ? (eventOrInput.target as HTMLInputElement) : eventOrInput;
    if (target && target.classList.contains(CssClasses.INPUT_ERROR)) {
      if (isValidValue(target.id, target.value)) {
        target.classList.remove(CssClasses.INPUT_ERROR);
        const errorBox: Element | null = target.nextElementSibling;
        if (errorBox !== null) {
          errorBox.classList.add(CssClasses.HIDDEN);
        }
      } else {
        this.setErrorMessages();
      }
    }
  }

  private setErrorMessages(): void {
    const invalidFields: HTMLInputElement[] = this.getInvalidFields();
    invalidFields.forEach((field: HTMLInputElement): void => {
      const { ERROR_ICON, ERROR_TEXT } = CssClasses;
      const selector: string = field.id;
      const errorImg = <HTMLImageElement>this.$(`${classSelector(ERROR_ICON)}${classSelector(selector)}`);
      const errorContent = this.$(`${classSelector(ERROR_TEXT)}${classSelector(selector)}`);
      const errorMessage: string = !field.value
        ? ErrorMessages.EMPTY_FIELD[`${field.name}`]
        : ErrorMessages.INVALID_VALUE[`${field.name}`];
      if (errorContent !== null && errorImg !== null) {
        errorContent.textContent = errorMessage;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        errorImg.src = warningIcon;
      }
    });
  }

  private showErrors(): void {
    const invalidFields: HTMLInputElement[] = this.getInvalidFields();
    invalidFields.forEach((field: HTMLInputElement): void => {
      field.classList.add(CssClasses.INPUT_ERROR);
      const errorBox: Element | null = field.nextElementSibling;
      if (errorBox !== null) {
        errorBox.classList.remove(CssClasses.HIDDEN);
      }
    });
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
      email?.classList.add(CssClasses.INPUT_ERROR);
    }
    this.showRegistrationResult(error.message);
  }

  private showRegistrationResult(message: string): void {
    const { POP_UP, ICON, MESSAGE, HIDDEN } = CssClasses;
    const popup = <HTMLDivElement>this.$(classSelector(POP_UP));
    const iconBox = <HTMLImageElement>this.$(classSelector(ICON));
    const messageBox = <HTMLDivElement>this.$(classSelector(MESSAGE));
    if (popup && iconBox && messageBox) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      iconBox.src = this.isSignUp ? successIcon : errorIcon;
      messageBox.textContent = message;
      const popupSize = 300;
      popup.style.top = `${(document.documentElement.clientHeight - popupSize) / 2 + window.scrollY}px`;
      popup.style.left = `${(document.documentElement.clientWidth - popupSize) / 2}px`;
      popup.classList.remove(HIDDEN);
    }
  }

  private setAddress(values: Map<string, string>, addressType: AddressType): BaseAddress {
    const address: BaseAddress = {
      streetName: values.get(InputID[`${addressType}_STREET`]),
      city: values.get(InputID[`${addressType}_CITY`]),
      postalCode: values.get(InputID[`${addressType}_CODE`]),
      country: this.country,
    };
    return address;
  }

  private setCustomerInformation(): void {
    const { FIRST_NAME, LAST_NAME, EMAIL, PASSWORD, DATE_OF_BIRTH, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    const inputValues: Map<string, string> = new Map();
    this.fields.forEach((field) => inputValues.set(field.id, field.value));
    this.customer.firstName = inputValues.get(FIRST_NAME);
    this.customer.lastName = inputValues.get(LAST_NAME);
    this.customer.email = inputValues.get(EMAIL) || '';
    this.customer.password = inputValues.get(PASSWORD) || '';
    this.customer.dateOfBirth = inputValues.get(DATE_OF_BIRTH);
    const shippingAddress: BaseAddress = this.setAddress(inputValues, AddressType.SHIPPING);
    const billingAddress: BaseAddress = this.setAddress(inputValues, AddressType.BILLING);
    this.customer.addresses = [shippingAddress, billingAddress];
    const defaultShippingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_SHIPPING));
    const defaultBillingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_BILLING));
    const indexOfShipping: number = this.customer.addresses.indexOf(shippingAddress);
    let indexOfBilling: number = this.customer.addresses.indexOf(billingAddress);
    if (defaultShippingCheckbox && defaultBillingCheckbox) {
      this.customer.defaultShippingAddress = defaultShippingCheckbox.checked ? indexOfShipping : undefined;
      this.customer.defaultBillingAddress = defaultBillingCheckbox.checked ? indexOfBilling : undefined;
    }
    if (this.isShippingAsBilling) {
      this.customer.addresses = [shippingAddress];
      indexOfBilling = indexOfShipping;
      if (defaultShippingCheckbox && defaultBillingCheckbox) {
        this.customer.defaultBillingAddress = defaultBillingCheckbox.checked ? indexOfBilling : undefined;
      }
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
      })
      .catch((error: ErrorResponse) => {
        this.isSignUp = false;
        this.handleErrorResponse(error);
      });
  }

  private checkValuesBeforeSubmit(): void {
    const isValid: boolean = [...this.fields].every((field: HTMLInputElement): boolean =>
      isValidValue(field.id, field.value.trim())
    );
    if (isValid) {
      this.disableButtons();
      this.setCustomerInformation();
      this.register();
    } else {
      this.setErrorMessages();
      this.showErrors();
    }
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
      this.hideError(field);
    });
  }

  private hidePopupAndRedirect(event: Event): void {
    const { SELECT, HIDDEN, POP_UP, CONTAINER, MESSAGE } = CssClasses;
    const countrySelects = <HTMLDivElement[]>this.$$(classSelector(SELECT));
    countrySelects.forEach((select) => {
      if (
        !select.classList.contains(HIDDEN) &&
        !(event.target instanceof HTMLInputElement && event.target.name === 'country')
      ) {
        select.classList.add(HIDDEN);
      }
    });
    const target = event.target as HTMLDivElement;
    const popup = this.$(classSelector(POP_UP));
    if (
      popup !== null &&
      !target.classList.contains(CONTAINER) &&
      !target.classList.contains(POP_UP) &&
      !target.classList.contains(MESSAGE) &&
      !popup.classList.contains(HIDDEN)
    ) {
      popup.classList.add(HIDDEN);
      if (this.isSignUp) {
        logout();
        this.logIn();
        this.goToMainPage(HTML.SUCCESS).catch(console.error);
      }
      this.enableButtons();
    }
  }

  private logIn(): void {
    login(this.customer.email, this.customer.password)
      .then(({ body }) => {
        Store.customer = body.customer;
      })
      .catch(console.error);
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#');
    }
  }

  private checkIfUserLoggedIn(): void {
    if (Store.customer) {
      this.goToMainPage(HTML.ALREADY).then().catch(console.error);
    }
  }

  private disableButtons(): void {
    const { SUBMIT_BTN, LOGIN_BTN } = CssClasses;
    const submitBtn = <HTMLInputElement>this.$(classSelector(SUBMIT_BTN));
    const loginBtn = <HTMLInputElement>this.$(classSelector(LOGIN_BTN));
    if (submitBtn && loginBtn) {
      submitBtn.disabled = true;
      loginBtn.disabled = true;
    }
  }

  private enableButtons(): void {
    const { SUBMIT_BTN, LOGIN_BTN } = CssClasses;
    const submitBtn = <HTMLInputElement>this.$(classSelector(SUBMIT_BTN));
    const loginBtn = <HTMLInputElement>this.$(classSelector(LOGIN_BTN));
    if (submitBtn && loginBtn) {
      submitBtn.disabled = false;
      loginBtn.disabled = false;
    }
  }
}
