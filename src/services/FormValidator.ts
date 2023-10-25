import InputField from '../components/InputField';
import { classSelector } from '../utils/create-element';
import throwError from '../utils/throw-error';

enum CssClasses {
  INPUT = 'input-field__input',
  SUBMIT_BUTTON = 'submit-button',
}

export default class FormValidator {
  private inputFields: InputField[] = [];

  private submitButton!: HTMLInputElement;

  constructor(private form: HTMLElement) {
    if (form === null) {
      throwError(new Error('FormValidator cannot instantiate class'));
      return;
    }
    this.setInputFields(this.form);
    this.setSubmitButton();
    this.setCallback();
  }

  private setInputFields(container: HTMLElement | Element): void {
    const { children } = container;
    if (children.length) {
      [...children].forEach((element) => {
        if (element instanceof InputField) {
          this.inputFields.push(element);
          return;
        }
        if (element.children.length) {
          this.setInputFields(element);
        }
      });
    }
  }

  private setSubmitButton(): void {
    const { SUBMIT_BUTTON } = CssClasses;
    const button = this.form.querySelector<HTMLInputElement>(classSelector(SUBMIT_BUTTON));
    if (button === null) {
      throwError(new Error(`${SUBMIT_BUTTON} is 'null'`));
      return;
    }
    this.submitButton = button;
  }

  private setCallback(): void {
    this.inputFields.forEach((field) => {
      field
        .querySelector(classSelector(CssClasses.INPUT))
        ?.addEventListener('input', this.changeButtonState.bind(this));
    });
  }

  public changeButtonState(): void {
    this.submitButton.disabled = !this.isFormFilled();
  }

  private isFormFilled(): boolean {
    return this.inputFields.every((field) => field.hasValue() && field.isValidValue());
  }
}
