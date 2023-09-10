import ErrorMessages from '../constants';
import { classSelector } from '../utils/create-element';
import isValidValue from '../utils/is-valid-value';

enum CssClass {
  ERROR = 'field-error',
  ERROR_TEXT = 'error-box__content',
  HIDDEN = 'hidden',
}

export default class Validator {
  constructor(
    private inputs: HTMLInputElement[],
    private submitButton: HTMLInputElement
  ) {
    this.setCallback();
  }

  private setCallback(): void {
    this.inputs.forEach((input) => input.addEventListener('input', this.checkValue.bind(this)));
  }

  private checkValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (isValidValue(input.id, input.value)) {
      this.hideErrorMessage(input.id);
    } else {
      const errorMessage = !input.value
        ? ErrorMessages.EMPTY_FIELD[`${input.name}`]
        : ErrorMessages.INVALID_VALUE[`${input.name}`];
      this.setErrorMessage(input.id, errorMessage);
      this.showErrorMessage(input.id);
    }
    this.setSubmitButtonState();
  }

  public setSubmitButtonState(): void {
    if (this.isFormFilled()) {
      this.enableInput();
    } else {
      this.disableInput();
    }
  }

  private isFormFilled(): boolean {
    return this.inputs.every((input) => input.value && isValidValue(input.id, input.value));
  }

  public hideErrorMessage(inputId: string): void {
    const { ERROR, HIDDEN } = CssClass;
    const input = this.getInputById(inputId);
    const errorBox: Element | null = input.nextElementSibling;
    input.classList.remove(ERROR);
    errorBox?.classList.add(HIDDEN);
  }

  public showErrorMessage(inputId: string): void {
    const { ERROR, HIDDEN } = CssClass;
    const input = this.getInputById(inputId);
    const errorBox: Element | null = input.nextElementSibling;
    input.classList.add(ERROR);
    errorBox?.classList.remove(HIDDEN);
  }

  public setErrorMessage(inputId: string, message: string): void {
    const { ERROR_TEXT } = CssClass;
    const input = this.getInputById(inputId);
    const errorBox = input.nextElementSibling as HTMLDivElement;
    const errorContent = errorBox.querySelector(classSelector(ERROR_TEXT));
    if (errorContent !== null) {
      errorContent.textContent = message;
    }
  }

  private disableInput(): void {
    this.submitButton.disabled = true;
  }

  private enableInput(): void {
    this.submitButton.disabled = false;
  }

  private getInputById(inputId: string): HTMLInputElement {
    return this.inputs.find((input) => input.id === inputId) as HTMLInputElement;
  }
}
