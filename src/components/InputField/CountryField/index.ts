import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams, TypeOfAddress } from '../../../types';
import { classSelector } from '../../../utils/create-element';
import './country-field.scss';

const params: InputParams = {
  id: 'country',
  type: 'text',
};
const labelText = 'Country';

const getInputParams = (typeOfAddress?: TypeOfAddress): InputParams => {
  const separator = '-';
  const partsOfId = [typeOfAddress, params.id];
  return { id: partsOfId.join(separator), type: params.type };
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your country',
  invalidValue:
    "There's a problem with this country, even though it may appear correct. Please select a different country from the list",
};

enum CssClasses {
  LIST = 'country-field__country-list',
  COUNTRY = 'country-field__country',
  HIDDEN = 'hidden',
}

const listOfCountries = ['United States', 'Mexico'];

export default class CountryField extends InputField {
  private documentCallback: ((event: Event) => void) | undefined;

  protected writableField: CountryField | null = null;

  constructor(public typeOfAddress?: TypeOfAddress) {
    const inputParams = typeOfAddress ? getInputParams(typeOfAddress) : params;
    super({ inputParams, labelText });
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.input.addEventListener('focus', this.showCountryList.bind(this));
    this.input.addEventListener('input', this.showCountryList.bind(this));
    this.renderCountryList();

    this.documentCallback = this.closeCountryList.bind(this);
    document.addEventListener('click', this.documentCallback);
  }

  public isValidValue(): boolean {
    return Pattern.country.test(this.getInputValue());
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || ErrorMessage, this);
  }

  private renderCountryList(): void {
    const { LIST, COUNTRY, HIDDEN } = CssClasses;
    const container = document.createElement('div');
    container.classList.add(LIST, HIDDEN);

    listOfCountries.forEach((li) => {
      const country = document.createElement('div');
      country.classList.add(COUNTRY);
      country.textContent = li;
      country.addEventListener('click', this.hideCountryList.bind(this));
      container.append(country);
    });

    this.insertAdjacentElement('beforeend', container);
  }

  private showCountryList(): void {
    const { LIST, HIDDEN } = CssClasses;
    if (this.hasValue() && this.isValidValue()) {
      return;
    }
    const countryList = this.$(classSelector(LIST));
    if (countryList) {
      countryList.classList.remove(HIDDEN);
      const inputStyles = this.input.getBoundingClientRect();
      countryList.style.top = `${inputStyles.bottom + window.scrollY}px`;
      countryList.style.width = `${inputStyles.width}px`;
    }
  }

  private hideCountryList(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLDivElement)) {
      return;
    }

    const { HIDDEN, LIST } = CssClasses;
    if (target.textContent) {
      this.input.value = target.textContent;
    }
    this.input.dispatchEvent(new Event('input'));
    this.$(classSelector(LIST))?.classList.add(HIDDEN);
  }

  private closeCountryList(event: Event): void {
    const { target } = event;
    const { LIST, HIDDEN } = CssClasses;
    const countryList = this.$(classSelector(LIST));
    if (
      countryList !== null &&
      !countryList.classList.contains(HIDDEN) &&
      !(target instanceof HTMLInputElement && target === this.input)
    ) {
      countryList.classList.add(HIDDEN);
    }
  }

  private disconnectedCallback(): void {
    if (this.documentCallback) {
      document.removeEventListener('click', this.documentCallback);
    }
  }
}
