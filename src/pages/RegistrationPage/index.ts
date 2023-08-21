import './registration.scss';
import { BaseAddress, ErrorResponse } from '@commercetools/platform-sdk';
import html from './registration.html';
import Page from '../Page';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';
import CssClasses from './css-classes';
import { login, registration } from '../../services/API';
import InputID from '../../enums';
import successIcon from '../../assets/icons/success.svg';
import errorIcon from '../../assets/icons/error.svg';
import { ServerErrors, errorMessages } from '../../types/errors';
import warningIcon from '../../assets/icons/warning-icon.png';
import { pause } from '../../utils';
import Store from '../../services/Store';

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

  private email = '';

  private password = '';

  private isShippingAsBilling: boolean = false;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfLoginByTokenInLocalStorage();
    this.fields = this.querySelectorAll(`.${CssClasses.INPUT_FIELD}`);
    this.setCallback();
  }

  private setCallback(): void {
    this.fields.forEach((field: HTMLInputElement): void => {
      field.addEventListener('input', this.hideError.bind(this));
      field.addEventListener('invalid', (event: Event) => event.preventDefault());
    });

    const submitButton: HTMLInputElement | null = this.querySelector(`.${CssClasses.SUBMIT_BTN}`);
    if (submitButton !== null) {
      submitButton.addEventListener('click', this.checkValuesBeforeSubmit.bind(this));
    }

    const form: HTMLFormElement | null = this.querySelector(`.${CssClasses.FORM}`);
    if (form !== null) {
      form.addEventListener('submit', (event: Event) => event.preventDefault());
    }

    const sameAddressCheckbox: HTMLInputElement | null = this.querySelector(`#${CssClasses.CHECKBOX}`);
    if (sameAddressCheckbox !== null) {
      sameAddressCheckbox.addEventListener('change', this.setShippingAsBilling.bind(this));
    }

    const loginButton: HTMLInputElement | null = this.querySelector(`.${CssClasses.LOGIN_BTN}`);
    if (loginButton !== null) {
      loginButton.addEventListener('click', (): void => {
        window.location.href = '#login';
      });
    }

    this.addEventListener('click', this.hidePopupAndRedirect.bind(this));
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
      const selector: string = field.id;
      const errorImg: HTMLImageElement | null = this.querySelector(`.${CssClasses.ERROR_ICON}.${selector}`);
      const errorContent: Element | null = this.querySelector(`.${CssClasses.ERROR_TEXT}.${selector}`);
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
      const email = this.querySelector(`#${InputID.EMAIL}`);
      email?.classList.add(CssClasses.INPUT_ERROR);
    }
    this.showRegistrationResult(error.message);
  }

  private showRegistrationResult(message: string): void {
    const popup: HTMLDivElement | null = this.querySelector(`.${CssClasses.POP_UP}`);
    const iconBox: HTMLImageElement | null = this.querySelector(`.${CssClasses.ICON}`);
    const messageBox: HTMLDivElement | null = this.querySelector(`.${CssClasses.MESSAGE}`);
    if (popup && iconBox && messageBox) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      iconBox.src = this.isSignUp ? successIcon : errorIcon;
      messageBox.textContent = message;
      const popupSize = 300;
      popup.style.top = `${(document.documentElement.clientHeight - popupSize) / 2 + window.scrollY}px`;
      popup.style.left = `${(document.documentElement.clientWidth - popupSize) / 2}px`;
      popup.classList.remove(CssClasses.HIDDEN);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  private submitValues(): void {
    let defaultShippingNumber: number | undefined;
    let defaultBillingNumber: number | undefined;
    const inputValues: Map<string, string> = new Map();
    this.fields.forEach((field) => inputValues.set(field.id, field.value));
    this.password = inputValues.get(InputID.PASSWORD) || '';
    const defaultValue = '';
    const defaultCountry = 'US';
    const shippingAddress: BaseAddress = {
      streetName: inputValues.get(InputID.SHIPPING_STREET),
      city: inputValues.get(InputID.SHIPPIN_CITY),
      postalCode: inputValues.get(InputID.SHIPPING_CODE),
      country: defaultCountry,
    };
    const billingAddress: BaseAddress = {
      streetName: inputValues.get(InputID.BILLING_STREET),
      city: inputValues.get(InputID.BILLING_CITY),
      postalCode: inputValues.get(InputID.BILLING_CODE),
      country: defaultCountry,
    };
    let addresses: BaseAddress[] = [shippingAddress, billingAddress];
    const defaultShippingCheckbox: HTMLInputElement | null = this.querySelector(`#${InputID.DEFAULT_SHIPPING}`);
    const defaultBillingCheckbox: HTMLInputElement | null = this.querySelector(`#${InputID.DEFAULT_BILLING}`);
    const indexOfShipping: number = addresses.indexOf(shippingAddress);
    let indexOfBilling: number = addresses.indexOf(billingAddress);
    if (defaultShippingCheckbox && defaultBillingCheckbox) {
      defaultShippingNumber = defaultShippingCheckbox.checked ? indexOfShipping : undefined;
      defaultBillingNumber = defaultBillingCheckbox.checked ? indexOfBilling : undefined;
    }
    if (this.isShippingAsBilling) {
      addresses = [shippingAddress];
      indexOfBilling = indexOfShipping;
      if (defaultShippingCheckbox && defaultBillingCheckbox) {
        defaultBillingNumber = defaultShippingNumber;
      }
    }
    registration(
      inputValues.get(InputID.FIRST_NAME) || defaultValue,
      inputValues.get(InputID.LAST_NAME) || defaultValue,
      inputValues.get(InputID.EMAIL) || defaultValue,
      inputValues.get(InputID.PASSWORD) || defaultValue,
      inputValues.get(InputID.B_DAY) || defaultValue,
      addresses,
      defaultShippingNumber,
      [indexOfShipping],
      defaultBillingNumber,
      [indexOfBilling]
    )
      .then((response) => {
        this.isSignUp = true;
        const { customer } = response.body;
        this.email = customer.email;
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
    this.disableButtons();
    const isValid: boolean = [...this.fields].every((field: HTMLInputElement): boolean =>
      isValidValue(field.id, field.value.trim())
    );
    if (isValid) {
      this.submitValues();
    } else {
      this.setErrorMessages();
      this.showErrors();
    }
  }

  private setShippingAsBilling(event: Event): void {
    this.isShippingAsBilling = true;
    const shippingFileds: NodeListOf<HTMLInputElement> = this.querySelectorAll(`.${CssClasses.SHIPPING}`);
    const billingFileds: NodeListOf<HTMLInputElement> = this.querySelectorAll(`.${CssClasses.BILLING}`);
    const target = event.target as HTMLInputElement;
    shippingFileds.forEach((field: HTMLInputElement, index: number): void => {
      if (target.checked) {
        billingFileds[index].value = field.value;
      } else {
        billingFileds[index].value = '';
      }
    });
    billingFileds.forEach((field: HTMLInputElement): void => {
      this.hideError(field);
    });
  }

  private hidePopupAndRedirect(event: Event): void {
    const target = event.target as HTMLDivElement;
    const popup: HTMLDivElement | null = this.querySelector(`.${CssClasses.POP_UP}`);
    if (
      popup !== null &&
      !target.classList.contains(CssClasses.CONTAINER) &&
      !target.classList.contains(CssClasses.POP_UP) &&
      !target.classList.contains(CssClasses.MESSAGE) &&
      !popup.classList.contains(CssClasses.HIDDEN)
    ) {
      popup.classList.add(CssClasses.HIDDEN);
      if (this.isSignUp) {
        this.logIn();
        Store.user = { loggedIn: true };
        this.goToMainPage(HTML.SUCCESS).catch(console.error);
      }
      this.enableButtons();
    }
  }

  private logIn(): void {
    login(this.email, this.password).then().catch(console.error);
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#');
    }
  }

  private checkIfLoginByTokenInLocalStorage(): void {
    if (Store.user.loggedIn) {
      this.goToMainPage(HTML.ALREADY).then().catch(console.error);
    }
  }

  private disableButtons(): void {
    const submitBtn: HTMLInputElement | null = this.querySelector(`.${CssClasses.SUBMIT_BTN}`);
    const loginBtn: HTMLInputElement | null = this.querySelector(`.${CssClasses.LOGIN_BTN}`);
    if (submitBtn && loginBtn) {
      submitBtn.disabled = true;
      loginBtn.disabled = true;
    }
  }

  private enableButtons(): void {
    const submitBtn: HTMLInputElement | null = this.querySelector(`.${CssClasses.SUBMIT_BTN}`);
    const loginBtn: HTMLInputElement | null = this.querySelector(`.${CssClasses.LOGIN_BTN}`);
    if (submitBtn && loginBtn) {
      submitBtn.disabled = false;
      loginBtn.disabled = false;
    }
  }
}
