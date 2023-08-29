import Page from '../Page';
import html from './user-profile.html';
import row from './row-template.html';
import './user-profile.scss';
import Store from '../../services/Store';
import { pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import InputID from '../../enums/input-id';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_YET = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#">main page</a> in ${TIMER_HTML} sec...</p>`;

export default class UserProfile extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
  }

  private createAddressTable(): void {
    const table: HTMLTableElement | null = this.querySelector(`.${CssClasses.BODY}`);
    Store.customer.addresses.forEach((): void => {
      table?.insertAdjacentHTML('beforeend', row);
    });
  }

  private setMainInfo(): void {
    const { firstName, lastName, dateOfBirth, email, password } = Store.customer;
    const firstNameField = this.querySelector(`#${InputID.FIRST_NAME}`) as HTMLInputElement;
    const lastNameField = this.querySelector(`#${InputID.LAST_NAME}`) as HTMLInputElement;
    const dateOfBirthField = this.querySelector(`#${InputID.DATE_OF_BIRTH}`) as HTMLInputElement;
    const emailField = this.querySelector(`#${InputID.EMAIL}`) as HTMLInputElement;
    const passwordField = this.querySelector(`#${InputID.PASSWORD}`) as HTMLInputElement;
    firstNameField.value = firstName as string;
    lastNameField.value = lastName as string;
    dateOfBirthField.value = dateOfBirth as string;
    emailField.value = email;
    passwordField.value = password as string;
    [firstNameField, lastNameField, dateOfBirthField, emailField, passwordField].forEach(
      (field: HTMLInputElement): void => this.disableField(field.id)
    );
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const rows: NodeListOf<Element> = this.querySelectorAll(`.${CssClasses.ROW}`);
    const fieldOrder: string[] = ['street', 'city', 'postal-code', 'country'];
    rows.forEach((tableRow: Element, rowIndex: number): void => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const currentValues = [streetName, city, postalCode, country];
      const addressTypeContainer = tableRow.querySelector(`.${CssClasses.TYPE_OF_ADDRESS}`) as HTMLDivElement;
      const fields: NodeListOf<HTMLInputElement> = tableRow.querySelectorAll('input');
      fieldOrder.forEach((field: string, index: number): void => {
        const currentField: HTMLInputElement = fields[index];
        currentField.id = `${field}-${rowIndex}`;
        currentField.value = currentValues[index] as string;
        currentField.disabled = true;
      });
      if (defaultShippingAddressId === id) {
        UserProfile.setTypeOfAddress(addressTypeContainer, CssClasses.DEFAULT_SHIPPING);
      }
      if (defaultBillingAddressId === id) {
        UserProfile.setTypeOfAddress(addressTypeContainer, CssClasses.DEFAULT_BILLING);
      }
      if (shippingAddressIds?.includes(id as string)) {
        UserProfile.setTypeOfAddress(addressTypeContainer, CssClasses.SHIPPING);
      }
      if (billingAddressIds?.includes(id as string)) {
        UserProfile.setTypeOfAddress(addressTypeContainer, CssClasses.BILLING);
      }
    });
  }

  private static setTypeOfAddress(container: HTMLDivElement, addressType: string): void {
    [...container.children]
      .find((child: Element): boolean => child.classList.contains(addressType))
      ?.classList.remove(CssClasses.HIDDEN);
  }

  private disableField(id: string): void {
    const field = this.querySelector(`#${id}`) as HTMLInputElement;
    field.disabled = true;
  }

  private checkIfUserLoggedIn(): void {
    if (!Store.user.loggedIn) {
      this.goToMainPage(HTML_NOT_YET).then().catch(console.error);
      return;
    }
    this.createAddressTable();
    this.setMainInfo();
    this.setAddressInfo();
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#');
    }
  }
}
