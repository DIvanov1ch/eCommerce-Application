import { Address } from '@commercetools/platform-sdk';
import Page from '../Page';
import html from './user-profile.html';
import rowTemplate from './html-templates/row-template.html';
import infoTemplate from './html-templates/personal-template.html';
import passwordTemplate from './html-templates/password-template.html';
import editAddressTemplate from './html-templates/edit-addresses-template.html';
import addAddressTemplate from './html-templates/add-address-template.html';
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
  INFO: `<h2 class="template__title">If you want to edit an address, press "OK" and click on the address to edit it</h2>`,
};
const SubmitBtnValue = {
  OK: 'OK',
  SAVE: 'Save',
};

export default class UserProfile extends Page {
  private template = '';

  private isProfileEditing = false;

  private isEditAddressModeOn = false;

  private isAddressesEditing = false;

  private isAddressAdding = false;

  private addressID = '';

  private templates: Map<string, string>;

  constructor() {
    super(html);
    this.templates = new Map([
      [CssClasses.NAME_BOX, infoTemplate],
      [CssClasses.PASSWORD_BOX, passwordTemplate],
      [CssClasses.ADDRESS_BOX, editAddressTemplate],
      [CssClasses.ADD_BUTTON_BOX, addAddressTemplate],
    ]);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.checkIfUserLoggedIn();
    this.setCallback();
  }

  private createAddressTable(): void {
    const table: HTMLTableElement | null = this.querySelector(`.${CssClasses.BODY}`);
    Store.customer.addresses.forEach((): void => {
      table?.insertAdjacentHTML('beforeend', rowTemplate);
    });
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

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const rows = this.$$<'tr'>(`.${CssClasses.ROW}`);
    rows.forEach((tableRow: HTMLTableRowElement, rowIndex: number): void => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const { STREET, CITY, POSTAL_CODE, COUNTRY } = CssClasses;
      const addressTypeContainer = tableRow.querySelector(`.${CssClasses.TYPE_OF_ADDRESS}`) as HTMLDivElement;
      tableRow.setAttribute('id', id as string);
      this.setElementTextContent(`.${STREET}`, streetName, tableRow);
      this.setElementTextContent(`.${CITY}`, city, tableRow);
      this.setElementTextContent(`.${POSTAL_CODE}`, postalCode, tableRow);
      this.setElementTextContent(`.${COUNTRY}`, country, tableRow);
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
    this.createAddressTable();
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
    if (target instanceof HTMLTableRowElement && !this.isEditAddressModeOn) {
      return;
    }
    const fieldContainer = target.closest(`.${CssClasses.CONTAINER}`) as HTMLDivElement;
    const currentClass = [...fieldContainer.classList].find((cl) => this.templates.has(cl)) as string;
    this.template = this.templates.get(currentClass) as string;
    if (currentClass === (CssClasses.ADDRESS_BOX as string)) {
      this.isEditAddressModeOn = true;
    }
    if (currentClass === (CssClasses.NAME_BOX as string)) {
      this.isProfileEditing = true;
    }
    if (target.classList.contains(CssClasses.ADD_BUTTON_BOX)) {
      this.isEditAddressModeOn = false;
      this.isAddressAdding = true;
      this.template = this.templates.get(CssClasses.ADD_BUTTON_BOX) as string;
    }
    if (target instanceof HTMLTableRowElement) {
      this.addressID = target.id;
      this.isAddressAdding = false;
      this.isAddressesEditing = true;
      this.template = this.templates.get(CssClasses.ADDRESS_BOX) as string;
    }

    fieldContainer.classList.add(CssClasses.EDIT_MODE);
    this.setModalContent();
    this.showModal();
  }

  private disableEditMode(): void {
    if (!this.isEditAddressModeOn) {
      const fieldContainers: NodeListOf<HTMLDivElement> = this.querySelectorAll(`.${CssClasses.CONTAINER}`);
      fieldContainers.forEach((field: HTMLDivElement): void => field.classList.remove(CssClasses.EDIT_MODE));
    }
    this.isAddressAdding = false;
    this.isAddressesEditing = false;
    this.isProfileEditing = false;
  }

  private disableEditAddressMode(): void {
    const writeIcons: NodeListOf<Element> = this.querySelectorAll(`.${CssClasses.WRAPPER_WRITE}`);
    const cancelIcon = this.querySelector(`.${CssClasses.WRAPPER_CANCEL}`);
    const flag = this.querySelector(`.${CssClasses.EDIT_MODE_FLAG}`);
    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON_BOX}`) as HTMLButtonElement;
    writeIcons.forEach((icon: Element): void => icon.classList.remove(CssClasses.HIDDEN));
    cancelIcon?.classList.add(CssClasses.HIDDEN);
    flag?.classList.add(CssClasses.HIDDEN);
    addButton.disabled = false;
    this.isEditAddressModeOn = false;
    this.disableEditMode();
  }

  private setCallback(): void {
    const writeBoxes: NodeListOf<HTMLDivElement> = this.querySelectorAll(`.${CssClasses.WRAPPER_WRITE}`);
    [...writeBoxes].forEach((box) => box.addEventListener('click', this.enableEditMode.bind(this)));

    const overlay: HTMLDivElement | null = this.querySelector(`.${CssClasses.OVERLAY}`);
    overlay?.addEventListener('click', this.hideModal.bind(this));

    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON_BOX}`);
    addButton?.addEventListener('click', this.enableEditMode.bind(this));

    const submitBtn = this.querySelector(`.${CssClasses.SUBMIT_BUTTON}`);
    submitBtn?.addEventListener('click', this.hideOkModal.bind(this));

    const cancelIcon = this.querySelector(`.${CssClasses.WRAPPER_CANCEL}`);
    cancelIcon?.addEventListener('click', this.disableEditAddressMode.bind(this));

    const rows: NodeListOf<HTMLTableRowElement> = this.querySelectorAll(`.${CssClasses.ROW}`);
    rows.forEach((row: HTMLTableRowElement): void => row.addEventListener('click', this.enableEditMode.bind(this)));
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

  private hideOkModal(): void {
    const modal = this.querySelector(`.${CssClasses.OVERLAY}`);
    const writeIcons: NodeListOf<Element> = this.querySelectorAll(`.${CssClasses.WRAPPER_WRITE}`);
    const cancelIcon = this.querySelector(`.${CssClasses.WRAPPER_CANCEL}`);
    const flag = this.querySelector(`.${CssClasses.EDIT_MODE_FLAG}`);
    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON_BOX}`) as HTMLButtonElement;
    modal?.classList.add(CssClasses.HIDDEN);
    writeIcons.forEach((icon: Element): void => icon.classList.add(CssClasses.HIDDEN));
    cancelIcon?.classList.remove(CssClasses.HIDDEN);
    flag?.classList.remove(CssClasses.HIDDEN);
    addButton.disabled = true;
    this.isEditAddressModeOn = true;
  }

  private setModalContent(): void {
    this.clearModalContent();
    const contentBox = this.querySelector(`.${CssClasses.MODAL}`);
    const button = this.querySelector(`.${CssClasses.SUBMIT_BUTTON}`) as HTMLInputElement;
    if (this.isEditAddressModeOn && !this.isAddressesEditing) {
      contentBox?.insertAdjacentHTML('afterbegin', ADDRESS_TITLE.INFO);
      button.value = SubmitBtnValue.OK;
      button.disabled = false;
      this.isEditAddressModeOn = false;
      return;
    }
    if (this.isAddressAdding) {
      contentBox?.insertAdjacentHTML('afterbegin', ADDRESS_TITLE.ADD);
    }
    if (this.isAddressesEditing) {
      contentBox?.insertAdjacentHTML('afterbegin', ADDRESS_TITLE.EDIT);
    }
    contentBox?.insertAdjacentHTML('beforeend', this.template);
    button.value = SubmitBtnValue.SAVE;
    button.disabled = true;
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
    if (this.isAddressesEditing) {
      const { addresses } = Store.customer;
      let ordinalNumber = -1;
      const addressToChange = addresses.find((address, index) => {
        ordinalNumber = index + 1;
        return address.id === this.addressID;
      }) as Address;
      const { streetName, city, postalCode } = addressToChange;
      const { STREET, CITY, POSTAL_CODE } = InputID;
      const legentContent = 'Address';

      this.setInputValue(`#${STREET}`, streetName);
      this.setInputValue(`#${CITY}`, city);
      this.setInputValue(`#${POSTAL_CODE}`, postalCode);
      this.setElementTextContent(`.${CssClasses.ADDRESS_TITLE}`, `${legentContent} ${ordinalNumber}`);
    }
    if (this.isProfileEditing) {
      const { firstName, lastName, dateOfBirth, email } = Store.customer;
      const { FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, EMAIL } = InputID;
      this.setInputValue(`#${FIRST_NAME}`, firstName);
      this.setInputValue(`#${LAST_NAME}`, lastName);
      this.setInputValue(`#${DATE_OF_BIRTH}`, dateOfBirth);
      this.setInputValue(`#${EMAIL}`, email);
    }
  }
}
