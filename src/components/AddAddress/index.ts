import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import InputID from '../../enums/input-id';
import { classSelector, idSelector } from '../../utils/create-element';
import { getCheckboxState, makeCheckboxChecked, makeCheckboxUnchecked } from '../../utils/service-functions';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import FormValidator from '../../services/FormValidator';
import StreetField from '../InputField/StreetField';
import CityField from '../InputField/CityField';
import CountryField from '../InputField/CountryField';
import PostalCodeField from '../InputField/PostalCodeField';

const SubmitBtnValue = {
  ADD: 'Add address',
};

const ToastMessage = {
  ADDRESS_SAVED: 'New address saved',
  ERROR: 'The given current password does not match',
};

enum CssClasses {
  FIELDS = 'adress__fields',
}

const getAddressKey = (): string => Date.now().toString();

export default class AddAddress extends PopupMenu {
  private street = new StreetField();

  private city = new CityField();

  private postalCode = new PostalCodeField();

  private country = new CountryField();

  protected addressKey: string;

  constructor() {
    super(html, SubmitBtnValue.ADD, true);
    this.addressKey = getAddressKey();
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.render();
    this.validator = new FormValidator(this);

    this.setCheckboxCallback();
  }

  private render(): void {
    this.insertElements([this.street, this.city, this.postalCode, this.country], CssClasses.FIELDS);
  }

  private setCheckboxCallback(): void {
    const { DEFAULT_BILLING, DEFAULT_SHIPPING, BILLING_COUNTRY, SHIPPING_COUNTRY } = InputID;
    const defaultBillingCheckbox = this.$<'input'>(idSelector(DEFAULT_BILLING));
    const defaultShippingCheckbox = this.$<'input'>(idSelector(DEFAULT_SHIPPING));
    [defaultShippingCheckbox, defaultBillingCheckbox].forEach((checkbox) => {
      checkbox?.addEventListener('change', (event) => {
        const { target } = event;
        if (target instanceof HTMLInputElement && target.checked) {
          makeCheckboxChecked(idSelector(target.className));
        }
      });
    });

    const billingCountryCheckbox = this.$<'input'>(idSelector(BILLING_COUNTRY));
    const shippingCountryCheckbox = this.$<'input'>(idSelector(SHIPPING_COUNTRY));
    [billingCountryCheckbox, shippingCountryCheckbox].forEach((checkbox) => {
      checkbox?.addEventListener('change', (event) => {
        const { target } = event;
        if (target instanceof HTMLInputElement && !target.checked) {
          makeCheckboxUnchecked(classSelector(target.id));
        }
      });
    });
  }

  private setRequestBody(): void {
    const streetName = this.street.getInputValue();
    const city = this.city.getInputValue();
    const postalCode = this.postalCode.getInputValue();
    const country = this.country.getInputValue().slice(-3, -1);
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
