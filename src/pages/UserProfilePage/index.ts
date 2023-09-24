import { Customer } from '@commercetools/platform-sdk';
import Page from '../Page';
import html from './user-profile.html';
import addressLine from './address-line-template.html';
import './user-profile.scss';
import Store from '../../services/Store';
import { classSelector, pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import { logout } from '../../services/API';
import { loadCustomer } from '../../utils/load-data';
import LoggedInUser from '../../services/LoggedInUser';
import { setElementTextContent } from '../../utils/service-functions';
import ChangePassword from '../../components/ChangePassword';
import PopupMenu from '../../components/PopupMenu';
import AddAddress from '../../components/AddAddress';
import EditAddress from '../../components/EditAddress';
import EditProfile from '../../components/EditProfile';
import DeleteAddress from '../../components/DeleteAddress';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_LOGGED_IN = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#login">login page</a> in ${TIMER_HTML} sec...</p>`;
const HTML_SESSION_EXPIRED = `<h3>Your session has expired</h3>
<div>We're sorry, but we had to log you out and end your session. Please log in to your account <a href="#login">here</a>.</div><div>You will be redirected in ${TIMER_HTML} sec...</div>`;
const PASSWORD_DOT = '•';

export default class UserProfile extends Page {
  private customer: Customer = new LoggedInUser();

  private popupMenu: PopupMenu | undefined;

  private windowCallback: (() => void) | undefined;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    if (!UserProfile.isLoggedIn()) {
      this.goToLoginPage(HTML_NOT_LOGGED_IN).then().catch(console.error);
      return;
    }
    if (!UserProfile.isTokenFresh()) {
      this.goToLoginPage(HTML_SESSION_EXPIRED).then().catch(console.error);
      return;
    }

    this.load();
    this.setCallback();
  }

  private static isLoggedIn(): boolean {
    return !!Store.customer;
  }

  private static isTokenFresh(): boolean {
    if (!Store.token || Store.token.expirationTime <= Date.now()) {
      logout();
      return false;
    }
    return true;
  }

  private load(): void {
    loadCustomer()
      .then()
      .catch(() => {
        logout();
        this.goToLoginPage(HTML_SESSION_EXPIRED).then().catch(console.error);
      });
  }

  private updateCustomer(): void {
    this.customer = Store.customer as Customer;
    this.render();
  }

  private render(): void {
    this.renderAddress();
    this.setUserProfileInfo();
    this.setPasswordLengthDisplay();
  }

  private renderAddress(): void {
    this.createAddressLines();
    this.setAddressInfo();
    this.setAddressIconsCallback();
  }

  private async goToLoginPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#login');
    }
  }

  private createAddressLines(): void {
    const { LINE_WRAPPER } = CssClasses;
    this.clearContent(classSelector(LINE_WRAPPER));
    const container = this.$(classSelector(LINE_WRAPPER));
    this.customer.addresses.forEach((): void => {
      container?.insertAdjacentHTML('beforeend', addressLine);
    });
  }

  private setUserProfileInfo(): void {
    const { firstName, lastName, dateOfBirth, email } = this.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = CssClasses;
    if (firstName && lastName && dateOfBirth) {
      setElementTextContent({ container: this, selector: classSelector(FIRST_NAME), content: firstName });
      setElementTextContent({ container: this, selector: classSelector(LAST_NAME), content: lastName });
      setElementTextContent({ container: this, selector: classSelector(DATE_OF_BIRTH), content: dateOfBirth });
    }
    setElementTextContent({ container: this, selector: classSelector(EMAIL), content: email });
  }

  private setPasswordLengthDisplay(): void {
    const { password } = this.customer;
    const { PASSWORD } = CssClasses;
    const length = password?.length as number;
    setElementTextContent({ container: this, selector: classSelector(PASSWORD), content: PASSWORD_DOT.repeat(length) });
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      this.customer;
    const lines = this.$$(classSelector(CssClasses.ADDRESS_LINE));
    lines.forEach((line, rowIndex) => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const { STREET, CITY, POSTAL_CODE, COUNTRY, TYPE_OF_ADDRESS, ADDRESS_BOX } = CssClasses;
      const addressTypeContainer = <HTMLDivElement>line.querySelector(classSelector(TYPE_OF_ADDRESS));
      const addressContainer = <HTMLDivElement>line.querySelector(classSelector(ADDRESS_BOX));
      const addressTypes: string[] = [];
      if (id === defaultShippingAddressId) {
        addressTypes.push(CssClasses.DEFAULT_SHIPPING);
      }
      if (id === defaultBillingAddressId) {
        addressTypes.push(CssClasses.DEFAULT_BILLING);
      }
      if (shippingAddressIds?.includes(id as string)) {
        addressTypes.push(CssClasses.SHIPPING);
      }
      if (billingAddressIds?.includes(id as string)) {
        addressTypes.push(CssClasses.BILLING);
      }
      addressContainer.setAttribute('id', id as string);
      if (streetName && city && postalCode) {
        setElementTextContent({ container: line, selector: classSelector(STREET), content: streetName });
        setElementTextContent({ container: line, selector: classSelector(CITY), content: city });
        setElementTextContent({ container: line, selector: classSelector(POSTAL_CODE), content: postalCode });
      }
      setElementTextContent({ container: line, selector: classSelector(COUNTRY), content: country });
      UserProfile.setAddressTypes(addressTypeContainer, addressTypes);
    });
  }

  private static setAddressTypes(container: HTMLDivElement, addressTypes: string[]): void {
    addressTypes.forEach((type) => {
      [...container.children].find((child) => child.classList.contains(type))?.classList.remove(CssClasses.HIDDEN);
    });
  }

  private setCallback(): void {
    const { NAME_BOX, WRAPPER_WRITE, PASSWORD_BOX, ADD_BUTTON_BOX } = CssClasses;
    const writeProfileInfoBox = this.$(`${classSelector(NAME_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const writePasswordBox = this.$(`${classSelector(PASSWORD_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const addButton = this.$(classSelector(ADD_BUTTON_BOX));

    writeProfileInfoBox?.addEventListener('click', this.editProfile.bind(this));
    writePasswordBox?.addEventListener('click', this.changePassword.bind(this));
    addButton?.addEventListener('click', this.addNewAddress.bind(this));

    this.windowCallback = this.updateCustomer.bind(this);
    window.addEventListener('userchange', this.windowCallback);
  }

  private setAddressIconsCallback(): void {
    const { ADDRESS_BOX, WRAPPER_WRITE, WRAPPER_DELETE } = CssClasses;
    const writeAddressBoxes = this.$$(`${classSelector(ADDRESS_BOX)} ${classSelector(WRAPPER_WRITE)}`);
    const deleteBoxes = this.$$(classSelector(WRAPPER_DELETE));

    writeAddressBoxes.forEach((box) => box.addEventListener('click', this.editAddress.bind(this)));
    deleteBoxes.forEach((box) => box.addEventListener('click', this.deleteAddress.bind(this)));
  }

  private editProfile(): void {
    this.popupMenu = new EditProfile();
    this.popupMenu.show();
  }

  private changePassword(): void {
    this.popupMenu = new ChangePassword();
    this.popupMenu.show();
  }

  private editAddress(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(classSelector(CssClasses.CONTAINER)) as HTMLDivElement;
    this.popupMenu = new EditAddress(fieldContainer.id);
    this.popupMenu.show();
  }

  private deleteAddress(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(classSelector(CssClasses.CONTAINER)) as HTMLDivElement;
    this.popupMenu = new DeleteAddress(fieldContainer.id);
    this.popupMenu.show();
  }

  private addNewAddress(): void {
    this.popupMenu = new AddAddress();
    this.popupMenu.show();
  }

  private clearContent(selector: string): void {
    const contentBox = this.$(selector);
    if (contentBox) {
      while (contentBox.firstElementChild) {
        contentBox.firstElementChild.remove();
      }
    }
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('userchange', this.windowCallback as () => void);
  }
}
