import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import InputID from '../../enums/input-id';
import { classSelector, idSelector } from '../../utils/create-element';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import { getCheckboxState, makeCheckboxChecked, makeCheckboxUnchecked } from '../../utils/service-functions';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import FormValidator from '../../services/FormValidator';
import StreetField from '../InputField/StreetField';
import CityField from '../InputField/CityField';
import PostalCodeField from '../InputField/PostalCodeField';
import CountryField from '../InputField/CountryField';
import throwError from '../../utils/throw-error';

const SubmitBtnValue = {
  SAVE: 'Save',
};

enum CssClasses {
  SUBMIT_BUTTON = 'submit-button',
  FIELDS = 'adress__fields',
}

const CountryNames = new Map<string, string>([
  ['US', 'United States (US)'],
  ['MX', 'Mexico (MX)'],
]);

const ToastMessage = {
  ADDRESS_CHANGED: 'Address changed',
  DEFAULT_SHIPPING_ADDRESS_CHANGED: 'Default shipping address changed',
  DEFAULT_BILLING_ADDRESS_CHANGED: 'Default billing address changed',
  ERROR: 'Something went wrong',
};

export default class EditAddress extends PopupMenu {
  private street = new StreetField();

  private city = new CityField();

  private postalCode = new PostalCodeField();

  private country = new CountryField();

  private checkboxState = {
    billing: false,
    shipping: false,
    defaultBilling: false,
    defaultShipping: false,
  };

  constructor(protected addressId: string) {
    super(html, SubmitBtnValue.SAVE, true);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.render();
    this.validator = new FormValidator(this);

    this.setCheckboxCallback();
  }

  private render(): void {
    this.insertElements([this.street, this.city, this.postalCode, this.country], CssClasses.FIELDS);
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      this.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId);
    const { streetName, city, postalCode, country } = addressToChange || addresses[0];
    const { SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    this.street.setInputValue(streetName);
    this.city.setInputValue(city);
    this.postalCode.setInputValue(postalCode);
    this.country.setInputValue(CountryNames.get(country));
    if (this.addressId === defaultShippingAddressId) {
      makeCheckboxChecked(idSelector(DEFAULT_SHIPPING));
      this.checkboxState.defaultShipping = true;
    }
    if (this.addressId === defaultBillingAddressId) {
      makeCheckboxChecked(idSelector(DEFAULT_BILLING));
      this.checkboxState.defaultBilling = true;
    }
    if (shippingAddressIds?.includes(this.addressId)) {
      makeCheckboxChecked(idSelector(SHIPPING_COUNTRY));
      this.checkboxState.shipping = true;
    }
    if (billingAddressIds?.includes(this.addressId)) {
      makeCheckboxChecked(idSelector(BILLING_COUNTRY));
      this.checkboxState.billing = true;
    }
  }

  private setCheckboxCallback(): void {
    const { DEFAULT_BILLING, DEFAULT_SHIPPING, BILLING_COUNTRY, SHIPPING_COUNTRY } = InputID;
    const { SUBMIT_BUTTON } = CssClasses;
    const defaultBillingCheckbox = this.$<'input'>(idSelector(DEFAULT_BILLING));
    const defaultShippingCheckbox = this.$<'input'>(idSelector(DEFAULT_SHIPPING));
    const billingCheckbox = this.$<'input'>(idSelector(BILLING_COUNTRY));
    const shippingCheckbox = this.$<'input'>(idSelector(SHIPPING_COUNTRY));
    const submitButton = this.$<'input'>(classSelector(SUBMIT_BUTTON));
    if (submitButton === null) {
      throwError(new Error(`${SUBMIT_BUTTON} is 'null'`));
      return;
    }
    [billingCheckbox, shippingCheckbox, defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
      checkbox?.addEventListener('change', () => {
        submitButton.disabled = false;
      });
    });

    [defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
      checkbox?.addEventListener('change', (event) => {
        const { target } = event;
        if (target instanceof HTMLInputElement && target.checked) {
          makeCheckboxChecked(idSelector(target.className));
        }
      });
    });

    [billingCheckbox, shippingCheckbox].forEach((checkbox) => {
      checkbox?.addEventListener('change', (event) => {
        const { target } = event;
        if (target instanceof HTMLInputElement && !target.checked) {
          makeCheckboxUnchecked(classSelector(target.id));
        }
      });
    });
  }

  private setRequestBody(): void {
    const { addresses } = this.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId);
    const { streetName, city, postalCode } = addressToChange || addresses[0];
    const newStreetName = this.street.getInputValue();
    const newCity = this.city.getInputValue();
    const newPostalCode = this.postalCode.getInputValue();
    const country = this.country.getInputValue().slice(-3, -1);
    console.log(country);
    const actions: MyCustomerUpdateAction[] = [];
    if (streetName !== newStreetName || city !== newCity || postalCode !== newPostalCode) {
      actions.push({
        action: UpdateActions.CHANGE_ADDRESS,
        addressId: this.addressId,
        address: {
          streetName: newStreetName,
          city: newCity,
          postalCode: newPostalCode,
          country,
        },
      });
    }
    this.actions = actions;
    this.addUpdateActions();
  }

  protected submit(): void {
    this.setRequestBody();
    super.submit();
  }

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.ADDRESS_CHANGED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }

  private addUpdateActions(): void {
    const { addressId } = this;
    const { SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    const setAsShipping = getCheckboxState(idSelector(SHIPPING_COUNTRY));
    const setAsBilling = getCheckboxState(idSelector(BILLING_COUNTRY));
    const setAsDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const setAsDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));
    if (setAsShipping !== this.checkboxState.shipping) {
      const action = setAsShipping ? UpdateActions.ADD_SHIPPING_ADDRESS_ID : UpdateActions.REMOVE_SHIPPING_ADDRESS_ID;
      this.actions.push({ action, addressId });
    }
    if (setAsBilling !== this.checkboxState.billing) {
      const action = setAsBilling ? UpdateActions.ADD_BILLING_ADDRESS_ID : UpdateActions.REMOVE_BILLING_ADDRESS_ID;
      this.actions.push({ action, addressId });
    }
    if (setAsDefaultShipping !== this.checkboxState.defaultShipping) {
      const action = UpdateActions.SET_DEFAULT_SHIPPING_ADDRESS;
      const id = setAsDefaultShipping ? addressId : undefined;
      this.actions.push({ action, addressId: id });
    }
    if (setAsDefaultBilling !== this.checkboxState.defaultBilling) {
      const action = UpdateActions.SET_DEFAULT_BILLING_ADDRESS;
      const id = setAsDefaultBilling ? addressId : undefined;
      this.actions.push({ action, addressId: id });
    }
  }
}
