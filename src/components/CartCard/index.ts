import { LineItem, MyCartUpdateAction, Attribute } from '@commercetools/platform-sdk';
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

enum CssClasses {
  CART = 'cart-card',
  NAME = 'cart-card__name',
  IMAGE = 'cart-card__image',
  PRICE = 'price__main',
  AMOUNT = 'cart-card__amount',
  TOTAL = 'cart-card__total-price',
  REMOVE = 'cart-card__remove',
  PROMO = 'price__promo',
  DISCOUNTED_RPICE = 'price__discounted',
  HIDDEN = 'hidden',
  NOT_ACTUAL = 'not-actual',
}

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
  private windowCallback!: (event: Event) => void;

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
      variant: { attributes },
    } = this.lineItem;

    const variantName = nameFromAttributes(attributes);
    const itemName = name + (variantName ? ` (${variantName})` : '');

    this.insertHtml(classSelector(NAME), itemName);
    this.insertImages();
    this.setPrice();
    this.setTotalPrice();
    this.addItemCounter();
    if (this.lineItem.discountedPricePerQuantity.length) {
      this.setDiscountedPrice();
    }
  }

  private setCallback(): void {
    const { IMAGE, NAME, REMOVE } = CssClasses;
    const image = this.$(classSelector(IMAGE));
    const name = this.$(classSelector(NAME));
    [image, name].forEach(
      (element) =>
        element?.addEventListener('click', () => {
          window.location.href = `#product/${this.lineItem.productKey}`;
        })
    );

    this.$(classSelector(REMOVE))?.addEventListener('click', () => {
      this.removeLineItem().then().catch(console.error);
    });

    this.windowCallback = this.updateLineItem.bind(this);
    window.addEventListener('quantitychange', this.windowCallback);
  }

  protected insertImages(): void {
    const {
      variant: { images },
    } = this.lineItem;

    if (!images || !images.length) {
      return;
    }

    const [{ url }] = images;
    const image = createElement('img', { src: url });

    this.$(classSelector(CssClasses.IMAGE))?.replaceChildren(image);
  }

  protected setPrice(): void {
    const priceBox = new PriceBox();
    const {
      price: {
        value: { centAmount: price = 0 },
        discounted: { value: { centAmount: discounted = 0 } = {} } = {},
      },
    } = this.lineItem;

    priceBox.setPrice(price);
    priceBox.setDiscounted(discounted);

    this.$(classSelector(CssClasses.PRICE))?.replaceChildren(priceBox);
  }

  protected setTotalPrice(): void {
    const priceBox = new PriceBox();
    const {
      totalPrice: { centAmount },
    } = this.lineItem;

    priceBox.setPrice(centAmount);

    this.$(classSelector(CssClasses.TOTAL))?.replaceChildren(priceBox);
  }

  protected setDiscountedPrice(): void {
    const { PROMO, DISCOUNTED_RPICE, PRICE, HIDDEN, NOT_ACTUAL } = CssClasses;
    const priceBox = new PriceBox();
    const [discountedPrice] = this.lineItem.discountedPricePerQuantity;
    const {
      discountedPrice: {
        value: { centAmount: price = 0 },
      },
    } = discountedPrice;

    priceBox.setPrice(price);

    this.$(classSelector(DISCOUNTED_RPICE))?.replaceChildren(priceBox);
    this.$(classSelector(PROMO))?.classList.remove(HIDDEN);
    this.$(classSelector(PRICE))?.classList.add(NOT_ACTUAL);
  }

  protected addItemCounter(): void {
    const counterContainer = this.$(classSelector(CssClasses.AMOUNT));
    const itemCounter = new ItemCounter(this.lineItem.id, this.lineItem.quantity);
    counterContainer?.replaceChildren(itemCounter);
  }

  protected updateLineItem(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }
    const { customerCart } = Store;
    if (!customerCart) {
      throw new Error(`Customer cart is 'undefined'`);
    }
    if (event.detail === this.lineItem.id) {
      this.lineItem = customerCart.lineItems.find((line) => line.id === this.lineItem.id) || this.lineItem;
      this.setTotalPrice();
    }
  }

  protected async removeLineItem(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    createLoader(LOADER_TEXT);
    const { CHANGE_LINE_ITEM_QUANTITY } = UpdateActions;
    const { version, id } = Store.customerCart;
    const lineItemId = this.lineItem.id;
    const actions: MyCartUpdateAction[] = [{ action: CHANGE_LINE_ITEM_QUANTITY, lineItemId, quantity: 0 }];
    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    dispatch('itemdelete');
    deleteLoader();
  }

  private disconnectedCallback(): void {
    window.removeEventListener('quantitychange', this.windowCallback);
  }
}
