import { MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import { classSelector } from '../../utils/create-element';

const SubmitBtnValue = {
  DELETE: 'Delete',
};

const ToastMessage = {
  ADDRESS_REMOVED: 'Address removed',
  ERROR: 'Something went wrong',
};

enum CssClasses {
  STREET = 'street',
  CITY = 'city',
  POSTAL_CODE = 'postal-code',
  COUNTRY = 'country',
}

export default class DeleteAddress extends PopupMenu {
  constructor(protected addressId: string) {
    super(html, SubmitBtnValue.DELETE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.render();
  }

  private render(): void {
    const { addresses } = this.customer;
    const addressToDelete = addresses.find((address) => address.id === this.addressId);
    const { streetName, city, postalCode, country } = addressToDelete || addresses[0];
    const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
    this.setTextContent(classSelector(STREET), streetName);
    this.setTextContent(classSelector(CITY), city);
    this.setTextContent(classSelector(POSTAL_CODE), postalCode);
    this.setTextContent(classSelector(COUNTRY), country);
  }

  private setTextContent(selector: string, content = ''): void {
    const infoElement = this.$(selector);
    if (infoElement !== null) {
      infoElement.textContent = content;
    }
  }

  private setRequestBody(): void {
    const { addressId } = this;
    const actions: MyCustomerUpdateAction[] = [
      {
        action: UpdateActions.REMOVE_ADDRESS,
        addressId,
      },
    ];
    this.actions = actions;
  }

  protected submit(): void {
    this.setRequestBody();
    super.submit();
  }

  public showMessage(): void {
    const message = this.isUpdateSuccessful ? ToastMessage.ADDRESS_REMOVED : ToastMessage.ERROR;
    showToastMessage(message, this.isUpdateSuccessful);
    this.close();
  }
}
