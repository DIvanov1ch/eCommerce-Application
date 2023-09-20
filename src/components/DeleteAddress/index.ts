import { Address, Customer, MyCustomerUpdateAction } from '@commercetools/platform-sdk';
import PopupMenu from '../PopupMenu';
import html from './template.html';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import Store from '../../services/Store';
import { setElementTextContent } from '../../utils/service-functions';
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
    super(html, SubmitBtnValue.DELETE, false);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.fillTemplate();
  }

  private fillTemplate(): void {
    const { addresses } = Store.customer as Customer;
    const addressToDelete = addresses.find((address) => address.id === this.addressId) as Address;
    const { streetName, city, postalCode, country } = addressToDelete;
    const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
    if (streetName && city && postalCode) {
      setElementTextContent({ container: this, selector: classSelector(STREET), content: streetName });
      setElementTextContent({ container: this, selector: classSelector(CITY), content: city });
      setElementTextContent({ container: this, selector: classSelector(POSTAL_CODE), content: postalCode });
    }
    setElementTextContent({ container: this, selector: classSelector(COUNTRY), content: country });
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
