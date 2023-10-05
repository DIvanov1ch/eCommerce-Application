import { Cart, LineItem, MyCartUpdateAction } from '@commercetools/platform-sdk';
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

const ToastMessage = {
  CODE_APPLIED: 'Your Promo Code is applied',
  CODE_REMOVED: 'Your Promo Code is removed',
  ERROR: 'Something went wrong',
};

const PromoCodes = ['AUTUMN', 'SAVE15'];

export default class CartPage extends Page {
  private cart!: Cart;

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
        this.cart = body;
        this.render();
      })
      .catch(() => {
        this.createCart();
      });
  }

  protected setCallback(): void {
    const { CLEAR_BTN, APPLY_BTN, REMOVE_PROMO } = CssClasses;
    this.$(classSelector(CLEAR_BTN))?.addEventListener('click', CartPage.clearCart.bind(this));
    this.$(classSelector(APPLY_BTN))?.addEventListener('click', this.checkPromoCode.bind(this));
    this.$(classSelector(REMOVE_PROMO))?.addEventListener('click', () => {
      this.removeDiscountCode()
        .then(() => {
          this.hidePromoCodeTicket();
          this.render();
        })
        .catch(console.error);
    });
    this.updateCallback = this.updateCart.bind(this);
    this.removeCallback = this.loadCart.bind(this);
    window.addEventListener('quantitychange', this.updateCallback);
    window.addEventListener('itemdelete', this.removeCallback);
  }

  private updateCart(): void {
    const { customerCart } = Store;
    this.cart = customerCart || this.cart;
    this.setTotalPrice();
  }

  private render(): void {
    if (!this.cart.totalLineItemQuantity) {
      this.renderEmptyCart();
    } else {
      this.renderLineItems(this.cart.lineItems);
    }
    this.setTotalPrice();
  }

  private renderLineItems(lineItems: LineItem[]): void {
    const { CARTS, EMPTY_CART } = CssClasses;
    const carts = this.$(classSelector(CARTS));
    carts?.replaceChildren(...lineItems.map((lineItem: LineItem) => new CartCard(lineItem)));
    carts?.classList.remove(EMPTY_CART);

    this.enableButtons();
  }

  private renderEmptyCart(): void {
    const { CARTS, EMPTY_CART } = CssClasses;
    const carts = this.$(classSelector(CARTS));
    while (carts?.firstElementChild) {
      carts.firstElementChild.remove();
    }
    carts?.insertAdjacentHTML('afterbegin', HTML.EMPTY);
    carts?.classList.add(EMPTY_CART);

    this.disableButtons();
    this.promoCodeField.disableInput();
  }

  private createCart(): void {
    createNewCart()
      .then((body) => {
        Store.customerCart = body;
        this.cart = body;
        this.render();
      })
      .catch(console.error);
  }

  private static clearCart(): void {
    const modal = new ClearDialog();
    modal.show();
  }

  private checkPromoCode(): void {
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
    this.addDiscountCode(promoCode)
      .then(() => {
        this.promoCodeField.setInputValue('');
        this.render();
      })
      .catch(console.error);
  }

  private async addDiscountCode(code: string): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    const { ADD_DISCOUNT_CODE } = UpdateActions;
    const { id, version } = Store.customerCart;
    const actions: MyCartUpdateAction[] = [{ action: ADD_DISCOUNT_CODE, code }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    this.cart = updatedCart;
    showToastMessage(ToastMessage.CODE_APPLIED, true);
  }

  private async removeDiscountCode(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    const { REMOVE_DISCOUNT_CODE } = UpdateActions;
    const action = REMOVE_DISCOUNT_CODE;
    const { id, discountCodes, version } = Store.customerCart;
    const discountObject = discountCodes.find((code) => code.state === 'MatchesCart');
    const discountCodeId = discountObject?.discountCode.id;
    if (!discountCodeId) {
      return;
    }
    const actions: MyCartUpdateAction[] = [{ action, discountCode: { typeId: 'discount-code', id: discountCodeId } }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    this.cart = updatedCart;
    showToastMessage(ToastMessage.CODE_REMOVED, true);
  }

  private setTotalPrice(): void {
    const { PRICE, SUMMARY } = CssClasses;
    const {
      totalPrice: { centAmount: totalPrice },
      totalLineItemQuantity,
      discountCodes,
    } = this.cart;
    const priceBox = new PriceBox();
    if (discountCodes.length) {
      const discountObject = discountCodes.find((code) => code.state === 'MatchesCart');
      this.showPromoCodeTicket(discountObject?.discountCode.id as string)
        .then()
        .catch(console.error);
      const discountPrice = this.getDiscountPrice();
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

  private getDiscountPrice(): number {
    const { lineItems } = this.cart;
    const priceBeforeDiscount = lineItems.reduce((total, current) => {
      const value = current.price.discounted
        ? current.price.discounted.value.centAmount
        : current.price.value.centAmount;
      const { quantity } = current;
      return total + value * quantity;
    }, 0);
    return priceBeforeDiscount;
  }

  private disableButtons(): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER, NOT_ALLOWED, DISABLED } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.add(DISABLED));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.add(NOT_ALLOWED));
  }

  private enableButtons(): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER, NOT_ALLOWED, DISABLED } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.remove(DISABLED));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.remove(NOT_ALLOWED));
  }

  private async showPromoCodeTicket(discountCodeId: string): Promise<void> {
    const { HIDDEN, PROMO_TICKET, TICKET } = CssClasses;
    this.$(classSelector(PROMO_TICKET))?.classList.remove(HIDDEN);
    const promoCode = await getDiscountCode(discountCodeId);
    if (!promoCode.name) {
      return;
    }
    const {
      name: { [LANG]: name },
      code,
    } = promoCode;
    const htmlText = getPromoTicketHtml(code, name);
    const ticket = this.$(classSelector(TICKET));
    while (ticket?.firstElementChild) {
      ticket.firstElementChild.remove();
    }
    this.$(classSelector(CssClasses.TICKET))?.insertAdjacentHTML('afterbegin', htmlText);
  }

  private hidePromoCodeTicket(): void {
    this.$(classSelector(CssClasses.PROMO_TICKET))?.classList.add(CssClasses.HIDDEN);
  }

  private disconnectedCallback(): void {
    window.removeEventListener('quantitychange', this.updateCallback);
    window.removeEventListener('itemdelete', this.removeCallback);
  }
}
