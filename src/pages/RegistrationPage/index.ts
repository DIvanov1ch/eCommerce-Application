import './registration.scss';
import { ErrorResponse } from '@commercetools/platform-sdk';
import html from './registration.html';
import Page from '../Page';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';
import CssClasses from './css-classes';
import { registration } from '../../services/API';
import InputID from '../../enums';
import successIcon from '../../assets/icons/success.svg';
import errorIcon from '../../assets/icons/error.svg';
import { ServerErrors, errorMessages } from '../../types/errors';

export default class RegistrationPage extends Page {
  private isSignUp: boolean = false;

  private fields: NodeListOf<HTMLInputElement> = this.querySelectorAll(`.${CssClasses.INPUT_FIELD}`);

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.fields = this.querySelectorAll(`.${CssClasses.INPUT_FIELD}`);
    this.setCallback();
  }

  private setCallback(): void {
    this.fields.forEach((field: HTMLInputElement): void => {
      field.addEventListener('input', this.hideError.bind(this));
      field.addEventListener('invalid', (event: Event) => event.preventDefault());
    });

    const submitButton: HTMLInputElement | null = this.querySelector(`.${CssClasses.SUBMIT}`);
    if (submitButton !== null) {
      submitButton.addEventListener('click', this.checkValuesBeforeSubmit.bind(this));
    }

    const form: HTMLFormElement | null = this.querySelector(`.${CssClasses.FORM}`);
    if (form !== null) {
      form.addEventListener('submit', (event: Event) => event.preventDefault());
    }

    const successRegIcon: HTMLImageElement | null = this.querySelector(`.${CssClasses.ICON}`);
    if (successRegIcon !== null) {
      successRegIcon.addEventListener('click', this.hidePopupAndRedirect.bind(this));
    }

    this.addEventListener('click', this.hidePopupAndRedirect.bind(this));
  }

  private getInvalidFields(): HTMLInputElement[] {
    const invalidFields: HTMLInputElement[] = [...this.fields].filter(
      (field: HTMLInputElement): boolean => !isValidValue(field.id, field.value.trim())
    );
    return invalidFields;
  }

  private hideError(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement && target.classList.contains(CssClasses.INPUT_ERROR)) {
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
      const errorBox: Element | null = this.querySelector(`.${CssClasses.ERROR}.${selector}`);
      const errorMessage: string = !field.value
        ? ErrorMessages.EMPTY_FIELD[`${field.name}`]
        : ErrorMessages.INVALID_VALUE[`${field.name}`];
      if (errorBox !== null) {
        errorBox.textContent = errorMessage;
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
      const padding = 15;
      popup.style.top = `${(this.offsetHeight - popupSize) / 2 + padding}px`;
      popup.style.left = `${(this.offsetWidth - popupSize + padding) / 2}px`;
      popup.classList.remove(CssClasses.HIDDEN);
    }
  }

  private submitValues(): void {
    const inputValues: Map<string, string> = new Map();
    this.fields.forEach((field) => inputValues.set(field.id, field.value));
    const defaultValue = '';
    const defaultCountry = 'US';
    registration(
      inputValues.get(InputID.FIRST_NAME) || defaultValue,
      inputValues.get(InputID.LAST_NAME) || defaultValue,
      inputValues.get(InputID.EMAIL) || defaultValue,
      inputValues.get(InputID.PASSWORD) || defaultValue,
      inputValues.get(InputID.B_DAY) || defaultValue,
      inputValues.get(InputID.STREET) || defaultValue,
      inputValues.get(InputID.CITY) || defaultValue,
      inputValues.get(InputID.ZIP_CODE) || defaultValue,
      defaultCountry
    )
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
      this.submitValues();
    } else {
      this.setErrorMessages();
      this.showErrors();
    }
  }

  private hidePopupAndRedirect(event: Event): void {
    const target = event.target as HTMLDivElement;
    const popup: HTMLDivElement | null = this.querySelector(`.${CssClasses.POP_UP}`);
    if (
      popup !== null &&
      !target.classList.contains(CssClasses.CONTAINER) &&
      !target.classList.contains(CssClasses.POP_UP) &&
      !target.classList.contains(CssClasses.MESSAGE)
    ) {
      popup.classList.add(CssClasses.HIDDEN);
      if (this.isSignUp) {
        console.log('Redirect...'); // TODO redirect to main page
      }
    }
  }
}
