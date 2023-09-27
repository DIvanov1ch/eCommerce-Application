import { Customer } from '@commercetools/platform-sdk';
import Page from '../Page';
import html from './user-profile.html';
import './user-profile.scss';
import Store from '../../services/Store';
import { classSelector, pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import { logout } from '../../services/API';
import { loadCustomer } from '../../utils/load-data';
import ChangePassword from '../../components/ChangePassword';
import PopupMenu from '../../components/PopupMenu';
import AddAddress from '../../components/AddAddress';
import EditProfile from '../../components/EditProfile';
import AddressLine from '../../components/AddressLine';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_LOGGED_IN = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#login">login page</a> in ${TIMER_HTML} sec...</p>`;
const HTML_SESSION_EXPIRED = `<h3>Your session has expired</h3>
<div>We're sorry, but we had to log you out and end your session. Please log in to your account <a href="#login">here</a>.</div><div>You will be redirected in ${TIMER_HTML} sec...</div>`;
const PASSWORD_DOT = '•';
const MinPasswordLength = 8;

export default class UserProfile extends Page {
  private customer!: Customer;

  private popupMenu: PopupMenu | undefined;

  private windowCallback: (() => void) | undefined;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    if (!Store.customer) {
      this.goToLoginPage(HTML_NOT_LOGGED_IN).then().catch(console.error);
      return;
    }
    if (!Store.token || Store.token.expirationTime <= Date.now()) {
      logout();
      this.goToLoginPage(HTML_SESSION_EXPIRED).then().catch(console.error);
      return;
    }

    this.load();
    this.setCallbacks();
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
    if (Store.customer) {
      this.customer = Store.customer;
    }
    this.render();
  }

  private render(): void {
    this.createAddressLines();
    this.setPersonalDetails();
    this.displayPasswordLength();
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
    this.removeContent(classSelector(LINE_WRAPPER));
    const container = this.$(classSelector(LINE_WRAPPER));
    this.customer.addresses.forEach((address): void => {
      container?.insertAdjacentElement('beforeend', new AddressLine(address));
    });
  }

  private setPersonalDetails(): void {
    const { firstName, lastName, dateOfBirth, email } = this.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = CssClasses;
    this.setTextContent(classSelector(FIRST_NAME), firstName);
    this.setTextContent(classSelector(LAST_NAME), lastName);
    this.setTextContent(classSelector(DATE_OF_BIRTH), dateOfBirth);
    this.setTextContent(classSelector(EMAIL), email);
  }

  private displayPasswordLength(): void {
    const { password } = this.customer;
    const { PASSWORD } = CssClasses;
    const length = password?.length;
    this.setTextContent(classSelector(PASSWORD), PASSWORD_DOT.repeat(length || MinPasswordLength));
  }

  private setCallbacks(): void {
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

  private editProfile(): void {
    this.popupMenu = new EditProfile();
    this.popupMenu.show();
  }

  private changePassword(): void {
    this.popupMenu = new ChangePassword();
    this.popupMenu.show();
  }

  private addNewAddress(): void {
    this.popupMenu = new AddAddress();
    this.popupMenu.show();
  }

  private removeContent(selector: string): void {
    const contentBox = this.$(selector);
    if (contentBox) {
      while (contentBox.firstElementChild) {
        contentBox.firstElementChild.remove();
      }
    }
  }

  private setTextContent(selector: string, content = ''): void {
    const infoElement = this.$(selector);
    if (infoElement !== null) {
      infoElement.textContent = content;
    }
  }

  protected disconnectedCallback(): void {
    if (this.windowCallback) {
      window.removeEventListener('userchange', this.windowCallback);
    }
  }
}
