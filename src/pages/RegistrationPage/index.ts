import './registration.scss';
import html from './registration.html';
import Page from '../Page';
import isValidValue from '../../utils/is-valid-value';
import ErrorMessages from '../../constants';
import CssClasses from './css-classes';

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
