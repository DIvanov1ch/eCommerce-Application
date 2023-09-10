export function setInputValue(selector: string, value = ''): void {
  const input = <HTMLInputElement>document.querySelector(selector);
  input.value = value;
}

export function getInputValue(selector: string): string {
  const input = <HTMLInputElement>document.querySelector(selector);
  return input.value;
}

export function setElementTextContent(selector: string, container: HTMLElement, textContent = ''): void {
  const element = container.querySelector(selector);
  if (element) {
    element.textContent = textContent;
  }
}

export function makeCheckboxChecked(selector: string): void {
  const checkbox = <HTMLInputElement>document.querySelector(selector);
  checkbox.checked = true;
}

export function getCheckboxState(selector: string): boolean {
  const checkbox = <HTMLInputElement>document.querySelector(selector);
  return checkbox.checked;
}

export function disableInput(selector: string): void {
  const submitInput = <HTMLInputElement>document.querySelector(selector);
  submitInput.disabled = true;
}

export function enableInput(selector: string): void {
  const submitInput = <HTMLInputElement>document.querySelector(selector);
  submitInput.disabled = false;
}
