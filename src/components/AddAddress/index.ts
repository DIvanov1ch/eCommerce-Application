import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import { Country } from '../../config';
import InputID from '../../enums/input-id';
import Validator from '../../services/Validator';
import { idSelector } from '../../utils/create-element';
import { getCheckboxState, getInputValue, makeCheckboxChecked } from '../../utils/service-functions';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';

const SubmitBtnValue = {
  ADD: 'Add address',
};

const ToastMessage = {
  ADDRESS_SAVED: 'New address saved',
  ERROR: 'The given current password does not match',
};

const getAddressKey = (): string => Date.now().toString();

export default class AddAddress extends PopupMenu {
  protected addressKey: string;

  constructor() {
    super(html, SubmitBtnValue.ADD, true);
    this.addressKey = getAddressKey();
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const inputs = this.getAllInputs();
    const submitButton = this.getSubmitButton();
    this.validator = new Validator(inputs, submitButton);

    this.setCheckboxCallback();
  }

  private setCheckboxCallback(): void {
    const { DEFAULT_BILLING, DEFAULT_SHIPPING } = InputID;
    const defaultBillingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_BILLING));
    const defaultShippingCheckbox = <HTMLInputElement>this.$(idSelector(DEFAULT_SHIPPING));
    [defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
          makeCheckboxChecked(idSelector(target.className));
        }
      });
    });
  }

  private setRequestBody(): void {
    const { STREET, CITY, POSTAL_CODE } = InputID;
    const streetName = getInputValue(idSelector(STREET));
    const city = getInputValue(idSelector(CITY));
    const postalCode = getInputValue(idSelector(POSTAL_CODE));
    const country = Country.UnitedStates;
    const { addressKey } = this;
    const actions: MyCustomerUpdateAction[] = [
      {
        action: UpdateActions.ADD_ADDRESS,
        address: {
          key: addressKey,
          streetName,
          city,
          postalCode,
          country,
        },
      },
    ];
    this.actions = actions;
    this.addUpdateActions();
  }

  protected submit(): void {
    this.setRequestBody();
    super.submit();
  }

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.ADDRESS_SAVED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }

  private addUpdateActions(): void {
    const { SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;
    const setAsShipping = getCheckboxState(idSelector(SHIPPING_COUNTRY));
    const setAsBilling = getCheckboxState(idSelector(BILLING_COUNTRY));
    const setAsDefaultShipping = getCheckboxState(idSelector(DEFAULT_SHIPPING));
    const setAsDefaultBilling = getCheckboxState(idSelector(DEFAULT_BILLING));
    const { addressKey } = this;
    if (setAsShipping) {
      this.actions.push({
        action: UpdateActions.ADD_SHIPPING_ADDRESS_ID,
        addressKey,
      });
    }
    if (setAsBilling) {
      this.actions.push({
        action: UpdateActions.ADD_BILLING_ADDRESS_ID,
        addressKey,
      });
    }
    if (setAsDefaultShipping) {
      this.actions.push({
        action: UpdateActions.SET_DEFAULT_SHIPPING_ADDRESS,
        addressKey,
      });
    }
    if (setAsDefaultBilling) {
      this.actions.push({
        action: UpdateActions.SET_DEFAULT_BILLING_ADDRESS,
        addressKey,
      });
    }
  }
}
