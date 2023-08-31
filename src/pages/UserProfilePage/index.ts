import { Address } from '@commercetools/platform-sdk';
import Page from '../Page';
import html from './user-profile.html';
import rowTemplate from './html-templates/row-template.html';
import infoTemplate from './html-templates/personal-template.html';
import passwordTemplate from './html-templates/password-template.html';
import editAddressesTemplate from './html-templates/edit-addresses-template.html';
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
      [CssClasses.NAME, infoTemplate],
      [CssClasses.PASSWORD, passwordTemplate],
      [CssClasses.ADDRESS, editAddressesTemplate],
      [CssClasses.ADD_BUTTON, addAddressTemplate],
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
    const length = password?.length as number;
    const firstNameField = this.querySelector(`.${InputID.FIRST_NAME}`) as HTMLDivElement;
    const lastNameField = this.querySelector(`.${InputID.LAST_NAME}`) as HTMLDivElement;
    const dateOfBirthField = this.querySelector(`.${InputID.DATE_OF_BIRTH}`) as HTMLDivElement;
    const emailField = this.querySelector(`.${InputID.EMAIL}`) as HTMLDivElement;
    const passwordField = this.querySelector(`.${InputID.PASSWORD}`) as HTMLDivElement;
    firstNameField.textContent = firstName as string;
    lastNameField.textContent = lastName as string;
    dateOfBirthField.textContent = dateOfBirth as string;
    emailField.textContent = email;
    passwordField.textContent = PASSWORD_DOT.repeat(length);
  }

  private setAddressInfo(): void {
    const { addresses, defaultShippingAddressId, defaultBillingAddressId, shippingAddressIds, billingAddressIds } =
      Store.customer;
    const rows: NodeListOf<HTMLTableRowElement> = this.querySelectorAll(`.${CssClasses.ROW}`);
    const fieldOrder: string[] = ['street', 'city', 'postal-code', 'country'];
    rows.forEach((tableRow: HTMLTableRowElement, rowIndex: number): void => {
      const address = addresses[rowIndex];
      const { id, streetName, city, postalCode, country } = address;
      const currentValues = [streetName, city, postalCode, country];
      const addressTypeContainer = tableRow.querySelector(`.${CssClasses.TYPE_OF_ADDRESS}`) as HTMLDivElement;
      const fields: NodeListOf<HTMLDivElement> = tableRow.querySelectorAll(`.${CssClasses.CELL}`);
      tableRow.setAttribute('id', id as string);
      fieldOrder.forEach((field: string, index: number): void => {
        const currentField: HTMLDivElement = fields[index];
        currentField.id = `${field}-${rowIndex}`;
        currentField.textContent = currentValues[index] as string;
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
    if (currentClass === (CssClasses.ADDRESS as string)) {
      this.isEditAddressModeOn = true;
    }
    if (currentClass === (CssClasses.NAME as string)) {
      this.isProfileEditing = true;
    }
    if (target.classList.contains(CssClasses.ADD_BUTTON)) {
      this.isEditAddressModeOn = false;
      this.isAddressAdding = true;
      this.template = this.templates.get(CssClasses.ADD_BUTTON) as string;
    }
    if (target instanceof HTMLTableRowElement) {
      this.addressID = target.id;
      this.isAddressAdding = false;
      this.isAddressesEditing = true;
      this.template = this.templates.get(CssClasses.ADDRESS) as string;
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
    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON}`) as HTMLButtonElement;
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

    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON}`);
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
    const addButton = this.querySelector(`.${CssClasses.ADD_BUTTON}`) as HTMLButtonElement;
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
      const address = addresses.find((a, index) => {
        ordinalNumber = index + 1;
        return a.id === this.addressID;
      }) as Address;
      const { streetName, city, postalCode } = address;
      const streetField = this.querySelector(`#street`) as HTMLInputElement;
      const cityField = this.querySelector(`#city`) as HTMLInputElement;
      const postalCodeField = this.querySelector(`#postal-code`) as HTMLInputElement;
      const legend = this.querySelector('.address-title') as HTMLLegendElement;
      legend.textContent = `${legend.textContent} ${ordinalNumber}`;
      streetField.value = streetName as string;
      cityField.value = city as string;
      postalCodeField.value = postalCode as string;
    }
    if (this.isProfileEditing) {
      const { firstName, lastName, dateOfBirth, email } = Store.customer;
      const firstNameField = this.querySelector(`#${InputID.FIRST_NAME}`) as HTMLInputElement;
      const lastNameField = this.querySelector(`#${InputID.LAST_NAME}`) as HTMLInputElement;
      const dateOfBirthField = this.querySelector(`#${InputID.DATE_OF_BIRTH}`) as HTMLInputElement;
      const emailField = this.querySelector(`#${InputID.EMAIL}`) as HTMLInputElement;
      firstNameField.value = firstName as string;
      lastNameField.value = lastName as string;
      dateOfBirthField.value = dateOfBirth as string;
      emailField.value = email;
    }
  }
}
