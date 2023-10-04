import { MyCartUpdateAction } from '@commercetools/platform-sdk';
import { classSelector, dispatch } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import './item-counter.scss';
import html from './template.html';
import Store from '../../services/Store';
import { updateCart } from '../../services/API';
import showToastMessage from '../../utils/show-toast-message';
import UpdateActions from '../../enums/update-actions';

enum CssClasses {
  COMPONENT = 'item-counter',
  INCREASE = 'item-counter__button_increase',
  DECREASE = 'item-counter__button_decrease',
  COUNTER = 'item-counter__counter',
}

const ToastMessage = {
  ERROR: 'Something went wrong',
};

const Quantity = {
  MIN: 1,
  MAX: 9999,
};

type ElementType = HTMLInputElement | HTMLButtonElement;

export default class ItemCounter extends BaseComponent {
  private counter!: HTMLInputElement;

  private increaseButton!: HTMLButtonElement;

  private decreaseButton!: HTMLButtonElement;

  constructor(
    protected lineItemId: string,
    protected quantity: number
  ) {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    const { COMPONENT, COUNTER, INCREASE, DECREASE } = CssClasses;

    this.classList.add(COMPONENT);

    this.counter = this.getElementBySelector<HTMLInputElement>(classSelector(COUNTER));
    this.increaseButton = this.getElementBySelector<HTMLButtonElement>(classSelector(INCREASE));
    this.decreaseButton = this.getElementBySelector<HTMLButtonElement>(classSelector(DECREASE));

    this.counter.value = this.quantity.toString();
    this.updateButtonState();
    this.setCallback();
  }

  private getElementBySelector<T extends ElementType>(selector: string): T {
    const element = this.querySelector<T>(selector);
    if (element === null) {
      throw new Error(`${selector} is 'null'`);
    }
    return element;
  }

  protected setCallback(): void {
    this.counter.addEventListener('change', () => this.changeValue());
    this.increaseButton.addEventListener('click', () => this.changeValue(1));
    this.decreaseButton.addEventListener('click', () => this.changeValue(-1));
  }

  protected setValidQuantity(): void {
    if (this.quantity < Quantity.MIN) {
      this.quantity = Quantity.MIN;
    }
    if (this.quantity > Quantity.MAX) {
      this.quantity = Quantity.MAX;
    }
  }

  protected changeValue(delta = 0): void {
    if (delta === 0) {
      this.quantity = +this.counter.value;
    } else {
      this.quantity += delta;
    }

    this.setValidQuantity();
    this.counter.value = this.quantity.toString();
    this.updateButtonState();
    this.changeLineItemQuantity().then().catch(console.error);
  }

  private toggleForm(disabled = true): void {
    const fieldset = this.$<'fieldset'>('fieldset');
    if (fieldset) {
      fieldset.disabled = disabled;
    }
  }

  protected updateButtonState(): void {
    if (this.quantity === Quantity.MIN) {
      this.decreaseButton.disabled = true;
    } else {
      this.decreaseButton.disabled = false;
    }
    if (this.quantity === Quantity.MAX) {
      this.increaseButton.disabled = true;
    } else {
      this.increaseButton.disabled = false;
    }
  }

  protected async changeLineItemQuantity(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }

    this.toggleForm();
    const { CHANGE_LINE_ITEM_QUANTITY: action } = UpdateActions;
    const { version, id } = Store.customerCart;
    const { lineItemId, quantity } = this;
    const actions: MyCartUpdateAction[] = [{ action, lineItemId, quantity }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;

    this.toggleForm(false);
    dispatch('quantitychange', lineItemId);
  }
}
