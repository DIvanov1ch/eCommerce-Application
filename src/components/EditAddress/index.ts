import { Address, Customer, MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import InputID from '../../enums/input-id';
import Validator from '../../services/Validator';
import { classSelector, idSelector } from '../../utils/create-element';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import Store from '../../services/Store';
import { getCheckboxState, getInputValue, makeCheckboxChecked, setInputValue } from '../../utils/service-functions';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import { Country } from '../../config';

const SubmitBtnValue = {
  SAVE: 'Save',
};

enum CssClasses {
  SUBMIT_BUTTON = 'submit-button',
}

const ToastMessage = {
  ADDRESS_CHANGED: 'Address changed',
  DEFAULT_SHIPPING_ADDRESS_CHANGED: 'Default shipping address changed',
  DEFAULT_BILLING_ADDRESS_CHANGED: 'Default billing address changed',
  ERROR: 'Something went wrong',
};

export default class EditAddress extends PopupMenu {
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

    const inputs = this.getAllInputs();
    const submitButton = this.getSubmitButton();
    this.validator = new Validator(inputs, submitButton);

    this.setCheckboxCallback();
    this.fillTemplate();
  }

  private setCheckboxCallback(): void {
    const { DEFAULT_BILLING, DEFAULT_SHIPPING, BILLING_COUNTRY, SHIPPING_COUNTRY } = InputID;
    const defaultBillingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_BILLING));
    const defaultShippingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_SHIPPING));
    const billingCheckbox = <HTMLInputElement>this.$(idSelector(BILLING_COUNTRY));
    const shippingCheckbox = <HTMLInputElement>this.$(idSelector(SHIPPING_COUNTRY));
    const submitButton = <HTMLInputElement>this.$(classSelector(CssClasses.SUBMIT_BUTTON));
    [billingCheckbox, shippingCheckbox, defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        submitButton.disabled = false;
      });
    });
  }

  private fillTemplate(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer as Customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const { STREET, CITY, POSTAL_CODE, SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    setInputValue(idSelector(STREET), streetName);
    setInputValue(idSelector(CITY), city);
    setInputValue(idSelector(POSTAL_CODE), postalCode);
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

  private setRequestBody(): void {
    const { STREET, CITY, POSTAL_CODE } = InputID;
    const { addresses } = Store.customer as Customer;
    const addressToChange = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const newStreetName = getInputValue(idSelector(STREET));
    const newCity = getInputValue(idSelector(CITY));
    const newPostalCode = getInputValue(idSelector(POSTAL_CODE));
    const country = Country.UnitedStates;
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
