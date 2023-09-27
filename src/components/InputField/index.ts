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
  public input!: HTMLInputElement;

  private inputParams: InputParams;

  private labelText: string;

  protected hasPipe = false;

  protected writableField: InputField | null = null;

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
      throwError(new Error(`${INPUT} is 'null`));
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

  public hasValue(): boolean {
    return !!this.input.value;
  }

  public checkValue(): void {
    if (this.hasPipe) {
      this.writableField?.setInputValue(this.getInputValue());
    }
    if (!this.isValidValue()) {
      this.setWarning();
      this.displayWarning();
      return;
    }
    this.hideWarning();
  }

  public isValidValue(): boolean {
    return !!this.input.value.trim();
  }

  public setWarning(message: WarningMessage = ErrorMessage, container: HTMLElement = this): void {
    const { emptyField, invalidValue } = message;
    const { WARNING_TEXT_BOX } = CssClasses;
    const content = !this.hasValue() ? emptyField : invalidValue;
    const selector = classSelector(WARNING_TEXT_BOX);
    setElementTextContent({ container, selector, content });
  }

  public hideWarning(): void {
    const { WARNING, WARNING_CONTAINER, HIDDEN } = CssClasses;
    const warningBox = this.$(classSelector(WARNING_CONTAINER));
    if (warningBox) {
      warningBox.classList.add(HIDDEN);
    }
    this.input.classList.remove(WARNING);
  }

  public displayWarning(): void {
    const { WARNING, WARNING_CONTAINER, HIDDEN } = CssClasses;
    const warningBox = this.$(classSelector(WARNING_CONTAINER));
    if (warningBox) {
      warningBox.classList.remove(HIDDEN);
    }
    this.input.classList.add(WARNING);
  }

  public getInputValue(): string {
    return this.input.value;
  }

  public setInputValue(value = ''): void {
    this.input.value = value;
  }

  public disableInput(): void {
    this.input.disabled = true;
  }

  public enableInput(): void {
    this.input.disabled = false;
  }

  public pipe(writableField: InputField): void {
    this.hasPipe = true;
    this.writableField = writableField;
  }

  public unpipe(): void {
    this.hasPipe = false;
    this.writableField = null;
  }
}
