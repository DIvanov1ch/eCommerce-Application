import { Address } from '@commercetools/platform-sdk';
import BaseComponent from '../BaseComponent';
import html from './template.html';
import './address-line.scss';
import { classSelector } from '../../utils/create-element';
import Store from '../../services/Store';
import throwError from '../../utils/throw-error';
import PopupMenu from '../PopupMenu';
import EditAddress from '../EditAddress';
import DeleteAddress from '../DeleteAddress';

enum CssClasses {
  COMPONENT = 'address-line',
  SHIPPING = 'shipping',
  BILLING = 'billing',
  DEFAULT_SHIPPING = 'default-shipping',
  DEFAULT_BILLING = 'default-billing',
  HIDDEN = 'hidden',
  STREET = 'street',
  CITY = 'city',
  POSTAL_CODE = 'postal-code',
  COUNTRY = 'country',
  WRAPPER_WRITE = 'image__wrapper_write',
  WRAPPER_DELETE = 'image__wrapper_delete',
}

export default class AddressLine extends BaseComponent {
  private popupMenu: PopupMenu | undefined;

  constructor(private address: Address) {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    const { COMPONENT } = CssClasses;

    this.classList.add(COMPONENT);
    this.setAddress();
    this.setAddressTypes();
    this.setCallbacks();
  }

  public get id(): string {
    return this.address.id || '';
  }

  private setAddress(): void {
    const { streetName, city, postalCode, country } = this.address;
    const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
    this.setContent(classSelector(STREET), streetName);
    this.setContent(classSelector(CITY), city);
    this.setContent(classSelector(POSTAL_CODE), postalCode);
    this.setContent(classSelector(COUNTRY), country);
  }

  private setAddressTypes(): void {
    if (!Store.customer) {
      throwError(new Error('Customer does not exist'));
      return;
    }
    const { BILLING, SHIPPING, DEFAULT_BILLING, DEFAULT_SHIPPING, HIDDEN } = CssClasses;
    const { billingAddressIds, shippingAddressIds, defaultBillingAddressId, defaultShippingAddressId } = Store.customer;
    if (this.id === defaultBillingAddressId) {
      this.$(classSelector(DEFAULT_BILLING))?.classList.remove(HIDDEN);
    }
    if (this.id === defaultShippingAddressId) {
      this.$(classSelector(DEFAULT_SHIPPING))?.classList.remove(HIDDEN);
    }
    if (this.id && billingAddressIds?.includes(this.id)) {
      this.$(classSelector(BILLING))?.classList.remove(HIDDEN);
    }
    if (this.id && shippingAddressIds?.includes(this.id)) {
      this.$(classSelector(SHIPPING))?.classList.remove(HIDDEN);
    }
  }

  private setCallbacks(): void {
    const { WRAPPER_WRITE, WRAPPER_DELETE } = CssClasses;
    const writeAddressBox = this.$(classSelector(WRAPPER_WRITE));
    const deleteBox = this.$(classSelector(WRAPPER_DELETE));

    writeAddressBox?.addEventListener('click', this.editAddress.bind(this));
    deleteBox?.addEventListener('click', this.deleteAddress.bind(this));
  }

  private editAddress(): void {
    this.popupMenu = new EditAddress(this.id);
    this.popupMenu.show();
  }

  private deleteAddress(): void {
    this.popupMenu = new DeleteAddress(this.id);
    this.popupMenu.show();
  }

  private setContent(selector: string, content = ''): void {
    const infoElement = this.$(selector);
    if (infoElement !== null) {
      infoElement.textContent = content;
    }
  }
}
