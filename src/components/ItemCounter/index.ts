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

export default class ItemCounter extends BaseComponent {
  constructor(
    protected lineItemId: string,
    protected quantity: number
  ) {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.setCounterValue();
    this.setCallback();
  }

  protected setCallback(): void {
    const counter = this.$<'input'>(classSelector(CssClasses.COUNTER));
    counter?.addEventListener('change', () => this.changeValue());

    const increaseBtn = this.$<'button'>(classSelector(CssClasses.INCREASE));
    const decreaseBtn = this.$<'button'>(classSelector(CssClasses.DECREASE));
    increaseBtn?.addEventListener('click', () => this.changeValue(1));
    decreaseBtn?.addEventListener('click', () => this.changeValue(-1));
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
      this.quantity = +this.getCounterValue();
    } else {
      this.quantity += delta;
    }

    this.setValidQuantity();
    this.setCounterValue();
    this.changeLineItemQuantity(this.lineItemId, this.quantity).then().catch(console.error);
  }

  private toggleForm(disabled = true): void {
    const fieldset = this.$<'fieldset'>('fieldset');
    if (fieldset) {
      fieldset.disabled = disabled;
    }
  }

  private setCounterValue(): void {
    const counter = <HTMLInputElement>this.$(classSelector(CssClasses.COUNTER));
    counter.value = this.quantity.toString();
    this.updateButtonState();
  }

  private getCounterValue(): string {
    const counter = <HTMLInputElement>this.$(classSelector(CssClasses.COUNTER));
    return counter.value;
  }

  protected updateButtonState(): void {
    if (this.quantity === Quantity.MIN) {
      this.disableButton(CssClasses.DECREASE);
    } else {
      this.enableButton(CssClasses.DECREASE);
    }
    if (this.quantity === Quantity.MAX) {
      this.disableButton(CssClasses.INCREASE);
    } else {
      this.enableButton(CssClasses.INCREASE);
    }
  }

  protected disableButton(selector: string): void {
    const button = <HTMLButtonElement>this.$(classSelector(selector));
    button.disabled = true;
  }

  protected enableButton(selector: string): void {
    const button = <HTMLButtonElement>this.$(classSelector(selector));
    button.disabled = false;
  }

  protected async changeLineItemQuantity(lineItemId: string, quantity = 1): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }

    this.toggleForm();
    const { CHANGE_LINE_ITEM_QUANTITY: action } = UpdateActions;
    const { version, id } = Store.customerCart;
    const actions: MyCartUpdateAction[] = [{ action, lineItemId, quantity }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;

    this.toggleForm(false);
    dispatch('quantitychange');
  }
}
