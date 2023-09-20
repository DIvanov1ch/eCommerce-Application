import BaseComponent from '../BaseComponent';
import html from './template.html';
import './input-field.scss';
import { classSelector } from '../../utils/create-element';
import throwError from '../../utils/throw-error';
import { setElementTextContent } from '../../utils/service-functions';
import { WarningMessage } from '../../interfaces';
import { FieldParams, InputParams } from '../../types';

enum CssClasses {
  COMPONENT = 'input-field',
  LABEL = 'input-field__label',
  INPUT = 'input-field__input',
  WARNING_CONTAINER = 'input-field__warning-container',
  WARNING_TEXT_BOX = 'input-field__warning-content',
  WARNING = 'input-warning',
  HIDDEN = 'hidden',
}

const ErrorMessage: WarningMessage = {
  emptyField: 'This field cannot be empty',
  invalidValue: 'This value is invalid',
};

export default class InputField extends BaseComponent {
  protected input!: HTMLInputElement;

  private inputParams: InputParams;

  private labelText: string;

  constructor(fieldParams: FieldParams) {
    super(html);
    this.inputParams = fieldParams.inputParams;
    this.labelText = fieldParams.labelText;
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const { COMPONENT, INPUT } = CssClasses;
    this.classList.add(COMPONENT);
    const input = this.$<'input'>(classSelector(INPUT));

    if (input === null) {
      throwError(new Error('Input is possibly "null"'));
      return;
    }
    this.input = input;
    this.setInputParams();
    this.setLabelParams();
    this.setCallback();
  }

  private setInputParams(): void {
    const attributes = Object.entries(this.inputParams);
    attributes.forEach((attr) => {
      this.input.setAttribute(attr[0], attr[1]);
    });
  }

  private setLabelParams(): void {
    const { LABEL } = CssClasses;
    const label = this.$(classSelector(LABEL));
    if (label) {
      label.textContent = this.labelText;
      label.setAttribute('for', this.inputParams.id);
    }
  }

  private setCallback(): void {
    this.input.addEventListener('input', this.checkValue.bind(this));
  }

  protected hasValue(): boolean {
    return !!this.input.value;
  }

  protected checkValue(): void {
    if (this.isValidValue()) {
      this.hideWarning();
      return;
    }
    this.setWarning();
    this.displayWarning();
  }

  protected isValidValue(): boolean {
    return !!this.input.value.trim();
  }

  protected setWarning(message: WarningMessage = ErrorMessage, container: HTMLElement = this): void {
    const { emptyField, invalidValue } = message;
    const { WARNING_TEXT_BOX } = CssClasses;
    const content = !this.hasValue() ? emptyField : invalidValue;
    const selector = classSelector(WARNING_TEXT_BOX);
    setElementTextContent({ container, selector, content });
  }

  protected hideWarning(): void {
    const { WARNING, WARNING_CONTAINER, HIDDEN } = CssClasses;
    const warningBox = this.$(classSelector(WARNING_CONTAINER));
    if (warningBox) {
      warningBox.classList.add(HIDDEN);
    }
    this.input.classList.remove(WARNING);
  }

  protected displayWarning(): void {
    const { WARNING, WARNING_CONTAINER, HIDDEN } = CssClasses;
    const warningBox = this.$(classSelector(WARNING_CONTAINER));
    if (warningBox) {
      warningBox.classList.remove(HIDDEN);
    }
    this.input.classList.add(WARNING);
  }

  protected getInputValue(): string {
    return this.input.value;
  }
}
