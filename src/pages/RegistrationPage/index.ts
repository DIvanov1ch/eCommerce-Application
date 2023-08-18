import './registration.scss';
import html from './registration.html';
import Page from '../Page';
import { CssClasses } from '../../enums';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';

export default class RegistrationPage extends Page {
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
    });
    this.fields.forEach((field: HTMLInputElement): void => {
      field.addEventListener('invalid', RegistrationPage.hideDefaultError.bind(this));
    });

    const submitButton: HTMLInputElement | null = this.querySelector(`.${CssClasses.SUBMIT}`);
    if (submitButton !== null) {
      submitButton.addEventListener('click', this.checkValuesBeforeSubmit.bind(this));
    }
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

  private static hideDefaultError(event: Event): void {
    event.preventDefault();
  }

  private setErrorMessages(): void {
    const invalidFields: HTMLInputElement[] = this.getInvalidFields();
    invalidFields.forEach((field: HTMLInputElement): void => {
      const fieldClass: string = field.classList[1];
      const errorBox: Element | null = document.querySelector(`.${CssClasses.ERROR}.${fieldClass}`);
      const errorMessage: string = !field.value
        ? ErrorMessages.EMPTY_FIELD[`${fieldClass}`]
        : ErrorMessages.INVALID_VALUE[`${fieldClass}`];
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

  private submitValues(): void {
    console.log(this.fields);
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
}
