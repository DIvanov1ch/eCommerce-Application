import { Cart, LineItem, MyCartUpdateAction } from '@commercetools/platform-sdk';
import { createNewCart, getActiveCart, updateCart } from '../../services/API';
import Router from '../../services/Router';
import Page from '../Page';
import html from './cart.html';
import './cart.scss';
import CustomerCart from '../../services/CustomerCart';
import CssClasses from './css-classes';
import { classSelector } from '../../utils/create-element';
import CartCard from '../../components/CartCard';
import Store from '../../services/Store';
import { setElementTextContent } from '../../utils/service-functions';
import PriceBox from '../../components/PriceBox';
import ClearDialog from '../../components/ClearDialog';
import Validator from '../../services/Validator';
import UpdateActions from '../../enums/update-actions';
import showToastMessage from '../../utils/show-toast-message';
import ErrorMessages from '../../constants';

Router.registerRoute('cart', 'cart-page');

const HTML = {
  EMPTY: `<h3>Your Shopping Cart is empty</h3>
  <p>Looks like you have not added anything to your cart. You will find a lot of interesting products on our <a class="link" href="#catalog">Catalog</a> page.</p>`,
};

const ToastMessage = {
  CODE_APPLIED: 'Your Promo Code is applied',
  CODE_REMOVED: 'Your Promo Code is removed',
  ERROR: 'Something went wrong',
};

const PromoCodes = {
  AUTUMN: 'AUTUMN',
  WINTER_IS_COMING: 'WINTERISCOMING',
};

export default class CartPage extends Page {
  private cart: Cart = new CustomerCart();

  private promoValidator: Validator | undefined;

  private updateCallback: (() => void) | undefined;

  private removeCallback: (() => void) | undefined;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.PAGE);
    const promoInput = this.$(classSelector(CssClasses.PROMO_INPUT)) as HTMLInputElement;
    const applyButton = this.$(classSelector(CssClasses.APPLY_BTN)) as HTMLInputElement;
    this.promoValidator = new Validator([promoInput], applyButton);
    this.loadCart();
    this.setCallback();
  }

  private loadCart(): void {
    getActiveCart()
      .then((body) => {
        this.saveCart(body);
        this.render();
      })
      .catch(() => {
        this.createCart();
      });
  }

  protected setCallback(): void {
    const { CLEAR_BTN, APPLY_BTN, REMOVE_PROMO } = CssClasses;
    this.$(classSelector(CLEAR_BTN))?.addEventListener('click', CartPage.clearCart.bind(this));
    this.$(classSelector(APPLY_BTN))?.addEventListener('click', this.checkPromeCode.bind(this));
    this.$(classSelector(REMOVE_PROMO))?.addEventListener('click', () => {
      CartPage.removeDiscountCode()
        .then(() => {
          this.hidePromoCodeTicket();
          this.loadCart();
        })
        .catch(console.error);
    });
    this.updateCallback = this.updateCart.bind(this);
    this.removeCallback = this.loadCart.bind(this);
    window.addEventListener('quantitychange', this.updateCallback);
    window.addEventListener('itemdelete', this.removeCallback);
  }

  private saveCart(cart: Cart): void {
    Store.customerCart = cart;
    this.cart = cart;
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
  }

  private createCart(): void {
    createNewCart()
      .then((body) => {
        this.saveCart(body);
        this.render();
      })
      .catch(console.error);
  }

  private static clearCart(): void {
    const modal = new ClearDialog();
    modal.show();
  }

  private checkPromeCode(): void {
    const promoInput = this.$(classSelector(CssClasses.PROMO_INPUT)) as HTMLInputElement;
    const promoCode = promoInput.value;
    if (promoCode !== PromoCodes.AUTUMN) {
      this.promoValidator?.setErrorMessage(promoInput.id, ErrorMessages.INVALID_PROMO_CODE.promocode);
      this.promoValidator?.showErrorMessage(promoInput.id);
      return;
    }
    CartPage.addDiscountCode()
      .then(() => {
        promoInput.value = '';
        this.loadCart();
      })
      .catch(console.error);
  }

  private static async addDiscountCode(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    const { ADD_DISCOUNT_CODE } = UpdateActions;
    const code = PromoCodes.AUTUMN;
    const { id, version } = Store.customerCart;
    const actions: MyCartUpdateAction[] = [{ action: ADD_DISCOUNT_CODE, code }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    showToastMessage(ToastMessage.CODE_APPLIED, true);
  }

  private static async removeDiscountCode(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    const { REMOVE_DISCOUNT_CODE } = UpdateActions;
    const action = REMOVE_DISCOUNT_CODE;
    const { id, discountCodes, version } = Store.customerCart;
    const discountCodeId = <string>discountCodes.pop()?.discountCode.id;
    const actions: MyCartUpdateAction[] = [{ action, discountCode: { typeId: 'discount-code', id: discountCodeId } }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
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
      this.showPromoCodeTicket();
      const discountPrice = this.getDiscountPrice();
      priceBox.setPrice(discountPrice);
      priceBox.setDiscounted(totalPrice);
    } else {
      priceBox.setPrice(totalPrice);
    }
    const priceContainer = this.$(classSelector(PRICE));
    priceContainer?.replaceChildren(priceBox);
    setElementTextContent(classSelector(SUMMARY), this, (totalLineItemQuantity || 0).toString());
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
    const { SUBMIT_BTN, BUTTON_CONTAINER } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.add('disabledbutton'));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.add('notallowed'));
  }

  private enableButtons(): void {
    const { SUBMIT_BTN, BUTTON_CONTAINER } = CssClasses;
    this.$$(classSelector(SUBMIT_BTN)).forEach((button) => button.classList.remove('disabledbutton'));
    this.$$(classSelector(BUTTON_CONTAINER)).forEach((container) => container.classList.remove('notallowed'));
  }

  private showPromoCodeTicket(): void {
    this.$(classSelector(CssClasses.PROMO_TICKET))?.classList.remove(CssClasses.HIDDEN);
  }

  private hidePromoCodeTicket(): void {
    this.$(classSelector(CssClasses.PROMO_TICKET))?.classList.add(CssClasses.HIDDEN);
  }

  private disconnectedCallback(): void {
    window.removeEventListener('quantitychange', this.updateCallback as () => void);
    window.removeEventListener('itemdelete', this.removeCallback as () => void);
  }
}
