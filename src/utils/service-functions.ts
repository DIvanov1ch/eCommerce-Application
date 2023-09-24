import { TextContentParams } from '../types';
import throwError from './throw-error';

export function setInputValue(selector: string, value = ''): void {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throwError(new Error(`${selector} is 'null'`));
    return;
  }
  input.value = value;
}

export function getInputValue(selector: string): string {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throwError(new Error(`${selector} is 'null'`));
    return 'null';
  }
  return input.value;
}

export function setElementTextContent(params: TextContentParams): void {
  const { container, selector, content } = params;
  const element = container.querySelector(selector);
  if (element !== null) {
    element.textContent = content;
  }
}

export function makeCheckboxChecked(selector: string): void {
  const checkbox = document.querySelector<HTMLInputElement>(selector);
  if (checkbox === null) {
    throwError(new Error(`${selector} is 'null'`));
    return;
  }
  checkbox.checked = true;
}

export function getCheckboxState(selector: string): boolean {
  const checkbox = document.querySelector<HTMLInputElement>(selector);
  if (checkbox === null) {
    throwError(new Error(`${selector} is 'null'`));
    return false;
  }
  return checkbox.checked;
}

export function disableInput(selector: string): void {
  const submitInput = document.querySelector<HTMLInputElement>(selector);
  if (submitInput === null) {
    throwError(new Error(`${selector} is 'null'`));
    return;
  }
  submitInput.disabled = true;
}

export function enableInput(selector: string): void {
  const submitInput = document.querySelector<HTMLInputElement>(selector);
  if (submitInput === null) {
    throwError(new Error(`${selector} is 'null'`));
    return;
  }
  submitInput.disabled = false;
}
