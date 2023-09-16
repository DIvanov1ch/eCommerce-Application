import { Cart, MyCartUpdate, MyCartUpdateAction } from '@commercetools/platform-sdk';
import { classSelector, dispatch } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import './item-counter.scss';
import html from './template.html';
import Store from '../../services/Store';
import { getActiveCart, updateCart } from '../../services/API';
import UpdateActions from '../../enums/update-actions';

enum CssClasses {
  COMPONENT = 'item-counter',
  INCREASE = 'item-counter__button_increase',
  DECREASE = 'item-counter__button_decrease',
  COUNTER = 'item-counter__counter',
}

const Value = {
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
    this.setCounterValue(this.quantity);
    this.setCallback();
  }

  protected setCallback(): void {
    const counter = <HTMLInputElement>this.$(classSelector(CssClasses.COUNTER));
    counter.addEventListener('change', this.handleInputValue.bind(this));

    const increaseBtn = <HTMLButtonElement>this.$(classSelector(CssClasses.INCREASE));
    const decreaseBtn = <HTMLButtonElement>this.$(classSelector(CssClasses.DECREASE));
    increaseBtn.addEventListener('click', this.upValue.bind(this));
    decreaseBtn.addEventListener('click', this.downValue.bind(this));
  }

  protected handleInputValue(): void {
    const currentValue = +this.getCounterValue();
    const newValue = ItemCounter.getValidValue(currentValue);
    this.setCounterValue(newValue);
    this.setUpdateAction(newValue);
  }

  protected static getValidValue(value: number): number {
    let validValue = value;
    if (value < Value.MIN) {
      validValue = Value.MIN;
    }
    if (value > Value.MAX) {
      validValue = Value.MAX;
    }
    return validValue;
  }

  protected upValue(): void {
    const currentValue = parseInt(this.getCounterValue(), 10);
    const newValue = currentValue + 1;
    const correctValue = ItemCounter.getValidValue(newValue);
    this.setCounterValue(correctValue);
    this.setUpdateAction(correctValue);
  }

  protected downValue(): void {
    const currentValue = parseInt(this.getCounterValue(), 10);
    const newValue = currentValue - 1;
    const correctValue = ItemCounter.getValidValue(newValue);
    this.setCounterValue(correctValue);
    this.setUpdateAction(correctValue);
  }

  private setCounterValue(value: number): void {
    const counter = <HTMLInputElement>this.$(classSelector(CssClasses.COUNTER));
    counter.value = value.toString();
    this.updateButtonState();
  }

  private getCounterValue(): string {
    const counter = <HTMLInputElement>this.$(classSelector(CssClasses.COUNTER));
    return counter.value;
  }

  protected updateButtonState(): void {
    const value = parseInt(this.getCounterValue(), 10);
    if (value === Value.MIN) {
      this.disableButton(CssClasses.DECREASE);
    } else {
      this.enableButton(CssClasses.DECREASE);
    }
    if (value === Value.MAX) {
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

  protected setUpdateAction(quantity = 1): void {
    const { lineItemId } = this;
    const updateAction: MyCartUpdateAction = {
      action: UpdateActions.CHANGE_LINE_ITEM_QUANTITY,
      lineItemId,
      quantity,
    };
    ItemCounter.updateLineItem(updateAction).then().catch(console.error);
  }

  protected static async updateLineItem(updateAction: MyCartUpdateAction): Promise<void> {
    const cart = Store.customerCart as Cart;
    const { version, id } = cart;
    const body: MyCartUpdate = {
      version,
      actions: [updateAction],
    };
    try {
      const newCart = await updateCart(id, body);
      Store.customerCart = newCart;
      dispatch('quantitychange');
    } catch (error) {
      const activeCart = await getActiveCart();
      Store.customerCart = activeCart;
    }
  }
}
