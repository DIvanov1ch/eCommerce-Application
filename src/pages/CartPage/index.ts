import { Cart, DiscountCodeInfo, LineItem, MyCartUpdateAction } from '@commercetools/platform-sdk';
import { createNewCart, getActiveCart, getDiscountCode, updateCart } from '../../services/API';
import Router from '../../services/Router';
import Page from '../Page';
import html from './cart.html';
import './cart.scss';
import CssClasses from './css-classes';
import { classSelector } from '../../utils/create-element';
import CartCard from '../../components/CartCard';
import Store from '../../services/Store';
import { setElementTextContent } from '../../utils/service-functions';
import PriceBox from '../../components/PriceBox';
import ClearDialog from '../../components/ClearDialog';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import PromoCodeField from '../../components/InputField/PromoCodeField';
import { WarningMessage } from '../../interfaces';
import { LANG } from '../../config';

Router.registerRoute('cart', 'cart-page');

const HTML = {
  EMPTY: `<h3>Your Shopping Cart is empty</h3>
  <p>Looks like you have not added anything to your cart. You will find a lot of interesting products on our <a class="link" href="#catalog">Catalog</a> page.</p>`,
};

const getPromoTicketHtml = (code: string, codeName: string): string => {
  return `<strong>${code}</strong> <span>applied</span> <span class="small">(${codeName})</span>`;
};

const getCartFromStore = (): Cart => {
  const { customerCart } = Store;
  if (!customerCart) {
    throw new Error('Cart has not been created yet');
  }
  return customerCart;
};

const getActiveDiscountId = (discountCodes: DiscountCodeInfo[]): string => {
  const discountCodeInfo = discountCodes.find((code) => code.state === 'MatchesCart');
  if (!discountCodeInfo) {
    throw new Error('No active Promo Codes');
  }
  return discountCodeInfo.discountCode.id;
};

enum ClassListActions {
  DISABLE = 'add',
  ENABLE = 'remove',
}

const ToastMessage = {
  CODE_APPLIED: 'Your Promo Code is applied',
  CODE_REMOVED: 'Your Promo Code is removed',
  ERROR: 'Something went wrong',
};

const PromoCodes = ['AUTUMN', 'SAVE15'];

export default class CartPage extends Page {
  private promoCodeField!: PromoCodeField;

  private updateCallback!: () => void;

  private removeCallback!: () => void;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    const { PAGE, PROMO_CODE } = CssClasses;
    this.classList.add(PAGE);
    this.promoCodeField = new PromoCodeField();
    this.$(classSelector(PROMO_CODE))?.insertAdjacentElement('afterbegin', this.promoCodeField);

    this.loadCart();
    this.setCallback();
  }

  private loadCart(): void {
    getActiveCart()
      .then((body) => {
        Store.customerCart = body;
        this.render();
      })
      .catch(() => {
        this.createCart();
      });
  }

  private createCart(): void {
    createNewCart()
      .then((body) => {
        Store.customerCart = body;
        this.render();
      })
      .catch(console.error);
  }

  protected setCallback(): void {
    const { CLEAR_BTN, APPLY_BTN, REMOVE_PROMO } = CssClasses;
    this.$(classSelector(CLEAR_BTN))?.addEventListener('click', () => new ClearDialog().show());
    this.$(classSelector(APPLY_BTN))?.addEventListener('click', this.applyPromoCode.bind(this));
    this.$(classSelector(REMOVE_PROMO))?.addEventListener('click', () => {
      CartPage.removeDiscountCode()
        .then(() => {
          this.hidePromoCodeTicket();
          this.render();
        })
        .catch(console.error);
    });
    this.updateCallback = this.setTotalPrice.bind(this);
    this.removeCallback = this.render.bind(this);
    window.addEventListener('quantitychange', this.updateCallback);
    window.addEventListener('itemdelete', this.removeCallback);
  }

  private render(): void {
    const { totalLineItemQuantity, lineItems, discountCodes } = getCartFromStore();
    if (!totalLineItemQuantity) {
      this.renderEmptyCart();
    } else {
      this.renderLineItems(lineItems);
    }
    if (discountCodes.length) {
      this.showPromoCodeTicket(discountCodes).then().catch(console.error);
    }
    this.setTotalPrice();
  }

  private renderLineItems(lineItems: LineItem[]): void {
    const { CARDS, EMPTY_CART } = CssClasses;
    const cards = this.$(classSelector(CARDS));
    cards?.replaceChildren(...lineItems.map((lineItem: LineItem) => new CartCard(lineItem)));
    cards?.classList.remove(EMPTY_CART);

    this.changeButtonState(ClassListActions.ENABLE);
  }

  private renderEmptyCart(): void {
    const { CARDS, EMPTY_CART } = CssClasses;
    const cards = this.$(classSelector(CARDS));
    while (cards?.firstElementChild) {
      cards.firstElementChild.remove();
    }
    cards?.insertAdjacentHTML('afterbegin', HTML.EMPTY);
    cards?.classList.add(EMPTY_CART);

    this.changeButtonState(ClassListActions.DISABLE);
    this.promoCodeField.disableInput();
    this.promoCodeField.hideWarning();
  }

  private applyPromoCode(): void {
    const promoCode = this.promoCodeField.getInputValue();
    if (!PromoCodes.includes(promoCode)) {
      const message: WarningMessage = {
        emptyField: 'Enter your Promo Code',
        invalidValue: 'The Promo Code you entered is invalid',
      };
      this.promoCodeField.setWarning(message);
      this.promoCodeField.displayWarning();
      return;
    }
    CartPage.addDiscountCode(promoCode)
      .then(() => {
        this.promoCodeField.setInputValue('');
        this.render();
      })
      .catch(console.error);
  }

  private static async addDiscountCode(code: string): Promise<void> {
    const cart = getCartFromStore();
    const { ADD_DISCOUNT_CODE: action } = UpdateActions;
    const { id, version } = cart;
    const actions: MyCartUpdateAction[] = [{ action, code }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    showToastMessage(ToastMessage.CODE_APPLIED, true);
  }

  private static async removeDiscountCode(): Promise<void> {
    const cart = getCartFromStore();
    const { REMOVE_DISCOUNT_CODE: action } = UpdateActions;
    const { id, version, discountCodes } = cart;
    const discountCodeId = getActiveDiscountId(discountCodes);
    const actions: MyCartUpdateAction[] = [{ action, discountCode: { typeId: 'discount-code', id: discountCodeId } }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    showToastMessage(ToastMessage.CODE_REMOVED, true);
  }

  private setTotalPrice(): void {
    const cart = getCartFromStore();
    const { PRICE, SUMMARY } = CssClasses;
    const {
      totalPrice: { centAmount: totalPrice },
      totalLineItemQuantity,
      discountCodes,
    } = cart;
    const priceBox = new PriceBox();
    if (discountCodes.length) {
      const discountPrice = CartPage.getDiscountPrice(cart);
      priceBox.setPrice(discountPrice);
      priceBox.setDiscounted(totalPrice);
    } else {
      priceBox.setPrice(totalPrice);
    }
    this.$(classSelector(PRICE))?.replaceChildren(priceBox);
    setElementTextContent({
      selector: classSelector(SUMMARY),
      container: this,
      content: (totalLineItemQuantity || 0).toString(),
    });
  }

  private static getDiscountPrice(cart: Cart): number {
    const { lineItems } = cart;
    const priceBeforeDiscount = lineItems.reduce((total, current) => {
      const value = current.price.discounted
        ? current.price.discounted.value.centAmount
        : current.price.value.centAmount;
      const { quantity } = current;
      return total + value * quantity;
    }, 0);
    return priceBeforeDiscount;
  }

  private changeButtonState(action: ClassListActions): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER, NOT_ALLOWED, DISABLED } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList[`${action}`](DISABLED));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList[`${action}`](NOT_ALLOWED));
  }

  private async showPromoCodeTicket(discountCodes: DiscountCodeInfo[]): Promise<void> {
    const id = getActiveDiscountId(discountCodes);
    const promoCode = await getDiscountCode(id);
    const { HIDDEN, PROMO_TICKET, TICKET } = CssClasses;
    this.$(classSelector(PROMO_TICKET))?.classList.remove(HIDDEN);
    const { name: { [LANG]: name } = {}, code } = promoCode;
    const htmlText = getPromoTicketHtml(code, name);
    const ticket = this.$(classSelector(TICKET));
    while (ticket?.firstElementChild) {
      ticket.firstElementChild.remove();
    }
    ticket?.insertAdjacentHTML('afterbegin', htmlText);
  }

  private hidePromoCodeTicket(): void {
    const { PROMO_TICKET, HIDDEN } = CssClasses;
    this.$(classSelector(PROMO_TICKET))?.classList.add(HIDDEN);
  }

  private disconnectedCallback(): void {
    window.removeEventListener('quantitychange', this.updateCallback);
    window.removeEventListener('itemdelete', this.removeCallback);
  }
}
