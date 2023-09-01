import { Address } from '@commercetools/platform-sdk';
import Page from '../Page';
import html from './user-profile.html';
import addressLine from './html-templates/address-line-template.html';
import personalTemplate from './html-templates/personal-popup-template.html';
import passwordTemplate from './html-templates/password-popup-template.html';
import addressTemplate from './html-templates/address-popup-template.html';
import deleteTemplate from './html-templates/delete-popup-template.html';
import './user-profile.scss';
import Store from '../../services/Store';
import { pause } from '../../utils/create-element';
import CssClasses from './css-classes';
import InputID from '../../enums/input-id';

const REDIRECT_DELAY = 5000;
const TIMER_HTML = `<time-out time="${REDIRECT_DELAY / 1000}"></time-out>`;
const HTML_NOT_YET = `<p>Looks like you are not logged into your account or have not created one yet. You will be redirected to <a href="#login">login page</a> in ${TIMER_HTML} sec...</p>`;
const PASSWORD_DOT = '•';
const ADDRESS_TITLE = {
  EDIT: `<h2 class="template__title">Manage your addresses</h2>`,
  ADD: `<h2 class="template__title">Add new address</h2>`,
};
const SubmitBtnValue = {
  DELETE: 'Delete',
  SAVE: 'Save',
};

export default class UserProfile extends Page {
  private template = '';

  private isProfileEditing = false;

  private isAddressDeleting = false;

  private isAddressEditing = false;

  private isAddressAdding = false;

  private addressID = '';

  private templates: Map<string, string>;

  constructor() {
    super(html);
    this.templates = new Map([
      [CssClasses.NAME_BOX, personalTemplate],
      [CssClasses.PASSWORD_BOX, passwordTemplate],
      [CssClasses.ADDRESS_BOX, addressTemplate],
      [CssClasses.NEW_ADDRESS_BOX, addressTemplate],
    ]);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
    this.setCallback();
  }

  private createAddressLines(): void {
    const container = this.querySelector(`.${CssClasses.LINE_WRAPPER}`);
    Store.customer.addresses.forEach((): void => {
      container?.insertAdjacentHTML('beforeend', addressLine);
    });
  }

  private setInputValue(selector: string, value = ''): void {
    const input = this.$<'input'>(selector);
    if (input) {
      input.value = value;
    }
  }

  private setElementTextContent(selector: string, textContent = '', container: HTMLElement = this): void {
    const element = container.querySelector(selector);
    if (element) {
      element.textContent = textContent;
    }
  }

  private makeCheckboxChecked(selector: string): void {
    const checkbox = this.$<'input'>(selector);
    if (checkbox) {
      checkbox.checked = true;
    }
  }

  private setMainInfo(): void {
    const { firstName, lastName, dateOfBirth, email, password } = Store.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL, PASSWORD } = CssClasses;
    const length = password?.length as number;

    this.setElementTextContent(`.${FIRST_NAME}`, firstName);
    this.setElementTextContent(`.${LAST_NAME}`, lastName);
    this.setElementTextContent(`.${DATE_OF_BIRTH}`, dateOfBirth);
    this.setElementTextContent(`.${EMAIL}`, email);
    this.setElementTextContent(`.${PASSWORD}`, PASSWORD_DOT.repeat(length));
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const lines = this.$$(`.${CssClasses.ADDRESS_LINE}`);
    lines.forEach((line, rowIndex) => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
      const addressTypeContainer = <HTMLDivElement>line.querySelector(`.${CssClasses.TYPE_OF_ADDRESS}`);
      const addressContainer = <HTMLDivElement>line.querySelector(`.${CssClasses.ADDRESS_BOX}`);
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
      this.setElementTextContent(`.${STREET}`, streetName, line);
      this.setElementTextContent(`.${CITY}`, city, line);
      this.setElementTextContent(`.${POSTAL_CODE}`, postalCode, line);
      this.setElementTextContent(`.${COUNTRY}`, country, line);
      UserProfile.setAddressTypes(addressTypeContainer, addressTypes);
    });
  }

  private static setAddressTypes(container: HTMLDivElement, addressTypes: string[]): void {
    addressTypes.forEach((type) => {
      [...container.children].find((child) => child.classList.contains(type))?.classList.remove(CssClasses.HIDDEN);
    });
  }

  private checkIfUserLoggedIn(): void {
    if (!Store.user.loggedIn) {
      this.goToMainPage(HTML_NOT_YET).then().catch(console.error);
      return;
    }
    this.createAddressLines();
    this.setMainInfo();
    this.setAddressInfo();
  }

  private async goToMainPage(htmlText: string): Promise<void> {
    this.innerHTML = htmlText;

    await pause(REDIRECT_DELAY);
    if (this.isConnected) {
      window.location.assign('#login');
    }
  }

  private enableEditMode(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(`.${CssClasses.CONTAINER}`) as HTMLDivElement;
    const currentClass = [...fieldContainer.classList].find((cl) => this.templates.has(cl)) as string;
    this.template = this.templates.get(currentClass) as string;
    if (currentClass === (CssClasses.NAME_BOX as string)) {
      this.isProfileEditing = true;
    }
    if (currentClass === (CssClasses.ADDRESS_BOX as string)) {
      this.addressID = fieldContainer.id;
      this.isAddressEditing = true;
    }
    if (currentClass === (CssClasses.NEW_ADDRESS_BOX as string)) {
      this.isAddressAdding = true;
    }

    fieldContainer.classList.add(CssClasses.EDIT_MODE);
    this.setModalContent();
    this.showModal();
  }

  private disableEditMode(): void {
    this.isAddressAdding = false;
    this.isAddressEditing = false;
    this.isProfileEditing = false;
    this.isAddressDeleting = false;
    this.addressID = '';
  }

  private setCallback(): void {
    const writeBoxes = this.$$(`.${CssClasses.WRAPPER_WRITE}`);
    writeBoxes.forEach((box) => box.addEventListener('click', this.enableEditMode.bind(this)));

    const deleteBoxes = this.$$(`.${CssClasses.WRAPPER_DELETE}`);
    deleteBoxes.forEach((box) => box.addEventListener('click', this.enableDeleteMode.bind(this)));

    const overlay = this.$(`.${CssClasses.OVERLAY}`);
    overlay?.addEventListener('click', this.hideModal.bind(this));

    const addButton = this.$(`.${CssClasses.ADD_BUTTON_BOX}`);
    addButton?.addEventListener('click', this.enableEditMode.bind(this));

    // const submitBtn = this.querySelector(`.${CssClasses.SUBMIT_BUTTON}`);
    // submitBtn?.addEventListener('click', this.hideOkModal.bind(this));
  }

  private showModal(): void {
    const modal = this.querySelector(`.${CssClasses.OVERLAY}`);
    modal?.classList.remove(CssClasses.HIDDEN);
  }

  private hideModal(event: Event): void {
    const target: HTMLDivElement = event.target as HTMLDivElement;
    if (
      !target.classList.contains(CssClasses.OVERLAY) &&
      !target.classList.contains(CssClasses.ICON_BOX) &&
      !target.classList.contains(CssClasses.ICON)
    ) {
      return;
    }
    const modal = this.querySelector(`.${CssClasses.OVERLAY}`);
    modal?.classList.add(CssClasses.HIDDEN);
    this.disableEditMode();
  }

  private setModalContent(): void {
    this.clearModalContent();
    const contentBox = this.querySelector(`.${CssClasses.MODAL}`);
    const button = this.querySelector(`.${CssClasses.SUBMIT_BUTTON}`) as HTMLInputElement;
    button.value = SubmitBtnValue.SAVE;
    button.disabled = true;
    if (this.isAddressAdding) {
      contentBox?.insertAdjacentHTML('afterbegin', ADDRESS_TITLE.ADD);
    }
    if (this.isAddressEditing) {
      contentBox?.insertAdjacentHTML('afterbegin', ADDRESS_TITLE.EDIT);
    }
    if (this.isAddressDeleting) {
      button.value = SubmitBtnValue.DELETE;
      button.disabled = false;
    }
    contentBox?.insertAdjacentHTML('beforeend', this.template);
    this.fillTemplate();
  }

  private clearModalContent(): void {
    const contentBox = this.querySelector(`.${CssClasses.MODAL}`);
    if (contentBox) {
      while (contentBox.firstElementChild) {
        contentBox.firstElementChild.remove();
      }
    }
  }

  private fillTemplate(): void {
    if (this.isAddressEditing) {
      this.fillAddressTemplate();
    }
    if (this.isProfileEditing) {
      this.fillPersonalTemplate();
    }
    if (this.isAddressDeleting) {
      this.fillDeleteTemplate();
    }
  }

  private fillAddressTemplate(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const addressToChange = addresses.find((address) => address.id === this.addressID) as Address;
    const { streetName, city, postalCode } = addressToChange;
    const { STREET, CITY, POSTAL_CODE, SHIPPING_COUNTRY, BILLING_COUNTRY, DEFAULT_SHIPPING, DEFAULT_BILLING } = InputID;

    this.setInputValue(`#${STREET}`, streetName);
    this.setInputValue(`#${CITY}`, city);
    this.setInputValue(`#${POSTAL_CODE}`, postalCode);
    if (this.addressID === defaultShippingAddressId) {
      this.makeCheckboxChecked(`#${DEFAULT_SHIPPING}`);
    }
    if (this.addressID === defaultBillingAddressId) {
      this.makeCheckboxChecked(`#${DEFAULT_BILLING}`);
    }
    if (shippingAddressIds?.includes(this.addressID)) {
      this.makeCheckboxChecked(`#${SHIPPING_COUNTRY}`);
    }
    if (billingAddressIds?.includes(this.addressID)) {
      this.makeCheckboxChecked(`#${BILLING_COUNTRY}`);
    }
  }

  private fillPersonalTemplate(): void {
    const { firstName, lastName, dateOfBirth, email } = Store.customer;
    const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
    this.setInputValue(`#${FIRST_NAME}`, firstName);
    this.setInputValue(`#${LAST_NAME}`, lastName);
    this.setInputValue(`#${DATE_OF_BIRTH}`, dateOfBirth);
    this.setInputValue(`#${EMAIL}`, email);
  }

  private fillDeleteTemplate(): void {
    const { addresses } = Store.customer;
    const addressToDelete = addresses.find((address) => address.id === this.addressID) as Address;
    const { streetName, city, postalCode, country } = addressToDelete;
    const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
    const container = <HTMLDivElement>this.$(`.${CssClasses.DELETE_BOX}`);
    this.setElementTextContent(`.${STREET}`, streetName, container);
    this.setElementTextContent(`.${CITY}`, city, container);
    this.setElementTextContent(`.${POSTAL_CODE}`, postalCode, container);
    this.setElementTextContent(`.${COUNTRY}`, country, container);
  }

  private enableDeleteMode(event: Event): void {
    this.isAddressDeleting = true;
    const target = event.currentTarget as HTMLElement;
    const fieldContainer = target.closest(`.${CssClasses.CONTAINER}`) as HTMLDivElement;
    this.addressID = fieldContainer.id;
    this.template = deleteTemplate;
    this.setModalContent();
    this.showModal();
  }
}
