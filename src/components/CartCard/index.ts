import { LineItem, Image, MyCartUpdate, MyCartUpdateAction, Cart } from '@commercetools/platform-sdk';
import './cart-card.scss';
import html from './template.html';
import Store from '../../services/Store';
import { LANG } from '../../config';
import { classSelector, createElement, dispatch } from '../../utils/create-element';
import BaseComponent from '../BaseComponent';
import PriceBox from '../PriceBox';
import ItemCounter from '../ItemCounter';
import { getActiveCart, updateCart } from '../../services/API';
import { createLoader, deleteLoader } from '../../utils/loader';
import UpdateActions from '../../enums/update-actions';

const TIMEOUT = 300;

const LOADER_TEXT = 'Delete';

const CssClasses = {
  CART: 'cart-card',
  NAME: 'cart-card__name',
  IMAGE: 'cart-card__image',
  PRICE: 'cart-card__price',
  AMOUNT: 'cart-card__amount',
  TOTAL: 'cart-card__total-price',
  REMOVE: 'cart-card__remove',
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

    if (!Store.customerCart) {
      this.showError();
      return;
    }

    const {
      name: { [LANG]: name },
      variant: { images, prices = [] },
      totalPrice: { centAmount },
    } = this.lineItem;

    const {
      value: { centAmount: price = 0 },
      discounted: { value: { centAmount: discounted = 0 } = {} } = {},
    } = prices[0] || {};

    this.insertHtml(classSelector(NAME), name);
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
    remove.addEventListener('click', this.setUpdateAction.bind(this));
    this.windowCallback = this.updateLineItem.bind(this);
    window.addEventListener('updateTotalCost', this.windowCallback);
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

  protected setUpdateAction(): void {
    const lineItemId = this.lineItem.id;
    const updateAction: MyCartUpdateAction = {
      action: UpdateActions.CHANGE_LINE_ITEM_QUANTITY,
      lineItemId,
      quantity: 0,
    };
    createLoader(LOADER_TEXT);
    setTimeout(() => {
      CartCard.removeLineItem(updateAction)
        .then(() => {
          if (this.lineItem.productSlug !== undefined) {
            const lineItemSlug = this.lineItem.productSlug.en;
            Store.customerCart?.lineItems.filter((el) => {
              return el.productSlug?.en !== lineItemSlug;
            });
          }
          deleteLoader();
        })
        .catch(console.error);
    }, TIMEOUT);
  }

  protected static async removeLineItem(updateAction: MyCartUpdateAction): Promise<void> {
    const cart = Store.customerCart as Cart;
    const { version, id } = cart;
    const body: MyCartUpdate = {
      version,
      actions: [updateAction],
    };
    try {
      const newCart = await updateCart(id, body);
      Store.customerCart = newCart;
      dispatch('removeLineItem');
    } catch (error) {
      const activeCart = await getActiveCart();
      Store.customerCart = activeCart;
    }
  }

  protected showError(): void {
    this.replaceChildren('Loading...');
  }

  private disconnectedCallback(): void {
    window.removeEventListener('updateTotalCost', this.windowCallback as () => void);
  }
}
