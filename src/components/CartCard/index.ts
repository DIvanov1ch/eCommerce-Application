import { LineItem, Image, MyCartUpdateAction, DiscountedLineItemPrice, Attribute } from '@commercetools/platform-sdk';
import './cart-card.scss';
import html from './template.html';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { classSelector, createElement, dispatch } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import PriceBox from '../PriceBox';
import ItemCounter from '../ItemCounter';
import { updateCart } from '../../services/API';
import { createLoader, deleteLoader } from '../../utils/loader';
import showToastMessage from '../../utils/show-toast-message';
import UpdateActions from '../../enums/update-actions';

const LOADER_TEXT = 'Delete';

const CssClasses = {
  CART: 'cart-card',
  NAME: 'cart-card__name',
  IMAGE: 'cart-card__image',
  PRICE: 'price__main',
  AMOUNT: 'cart-card__amount',
  TOTAL: 'cart-card__total-price',
  REMOVE: 'cart-card__remove',
  PROMO: 'price__promo',
  DISCOUNTED_RPICE: 'price__discounted',
  HIDDEN: 'hidden',
  NOT_ACTUAL: 'not-actual',
};

const ToastMessage = {
  ERROR: 'Something went wrong',
};

const nameFromAttributes = (attributes?: Attribute[]): string => {
  if (!attributes) return '';

  return attributes
    .filter((attr) => ['color', 'size'].includes(attr.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((attr) => String(attr.value))
    .join(', ');
};

export default class CartCard extends BaseComponent {
  private windowCallback: (() => void) | undefined;

  constructor(protected lineItem: LineItem) {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.CART);
    this.render();
    this.setCallback();
  }

  protected render(): void {
    const { NAME } = CssClasses;

    const {
      name: { [LANG]: name },
      variant: { images, prices = [], attributes },
      totalPrice: { centAmount },
      discountedPricePerQuantity,
    } = this.lineItem;

    const variantName = nameFromAttributes(attributes);
    const itemName = name + (variantName ? ` (${variantName})` : '');

    if (discountedPricePerQuantity.length) {
      this.setDiscountedPrice(discountedPricePerQuantity[0].discountedPrice);
    }
    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    this.insertHtml(classSelector(NAME), itemName);
    this.insertImages(images);
    this.setPrice(price, discounted);
    this.setTotalPrice(centAmount);
    this.addItemCounter();
  }

  private setCallback(): void {
    const image = <HTMLDivElement>this.$(classSelector(CssClasses.IMAGE));
    const name = <HTMLDivElement>this.$(classSelector(CssClasses.NAME));
    const remove = <HTMLDivElement>this.$(classSelector(CssClasses.REMOVE));
    [image, name].forEach((el) =>
      el.addEventListener('click', () => {
        window.location.href = `#product/${this.lineItem.productKey}`;
      })
    );
    remove.addEventListener('click', () => {
      CartCard.removeLineItem(this.lineItem).then().catch(console.error);
    });

    this.windowCallback = this.updateLineItem.bind(this);
    window.addEventListener('quantitychange', this.windowCallback);
  }

  protected insertImages(images?: Image[]): void {
    if (!images || !images.length) {
      return;
    }

    const [{ url }] = images;
    const image = createElement('img', { src: url });

    this.$(classSelector(CssClasses.IMAGE))?.replaceChildren(image);
  }

  protected setPrice(price: number, discounted: number): void {
    const priceContainer = this.$(classSelector(CssClasses.PRICE));
    const priceBox = new PriceBox();
    priceBox.setPrice(price);
    priceBox.setDiscounted(discounted);

    priceContainer?.replaceChildren(priceBox);
  }

  protected setTotalPrice(totalPrice: number): void {
    const priceContainer = this.$(classSelector(CssClasses.TOTAL));
    const priceBox = new PriceBox();
    priceBox.setPrice(totalPrice);

    priceContainer?.replaceChildren(priceBox);
  }

  protected setDiscountedPrice(discountedPrice: DiscountedLineItemPrice): void {
    const promoContainer = this.$(classSelector(CssClasses.PROMO));
    const discountContainer = this.$(classSelector(CssClasses.DISCOUNTED_RPICE));
    const priceContainer = this.$(classSelector(CssClasses.PRICE));
    const {
      value: { centAmount: price },
    } = discountedPrice;
    const priceBox = new PriceBox();
    priceBox.setPrice(price);

    discountContainer?.replaceChildren(priceBox);
    promoContainer?.classList.remove(CssClasses.HIDDEN);
    priceContainer?.classList.add(CssClasses.NOT_ACTUAL);
  }

  protected addItemCounter(): void {
    const counterContainer = this.$(classSelector(CssClasses.AMOUNT));
    const itemCounter = new ItemCounter(this.lineItem.id, this.lineItem.quantity);
    counterContainer?.replaceChildren(itemCounter);
  }

  protected updateLineItem(): void {
    const { customerCart } = Store;
    const lineItem = <LineItem>customerCart?.lineItems.find((line) => line.id === this.lineItem.id);
    this.lineItem = lineItem;
    this.setTotalPrice(this.lineItem.totalPrice.centAmount);
  }

  protected static async removeLineItem(lineItem: LineItem): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    createLoader(LOADER_TEXT);
    const { CHANGE_LINE_ITEM_QUANTITY } = UpdateActions;
    const { version, id } = Store.customerCart;
    const lineItemId = lineItem.id;
    const actions: MyCartUpdateAction[] = [{ action: CHANGE_LINE_ITEM_QUANTITY, lineItemId, quantity: 0 }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    dispatch('itemdelete');
    deleteLoader();
  }

  private disconnectedCallback(): void {
    if (this.windowCallback) {
      window.removeEventListener('quantitychange', this.windowCallback);
    }
  }
}
