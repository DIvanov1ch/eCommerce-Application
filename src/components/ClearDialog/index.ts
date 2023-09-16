import { Cart, LineItem, MyCartUpdate, MyCartUpdateAction } from '@commercetools/platform-sdk';
import { classSelector, createTemplate, dispatch } from '../../utils/create-element';
import ModalDialog from '../ModalDialog';
import html from './template.html';
import './clear-dialog.scss';
import Store from '../../services/Store';
import UpdateActions from '../../enums/update-actions';
import { getActiveCart, updateCart } from '../../services/API';

enum CssClasses {
  CONTENT = 'modal__content',
  COMPONENT = 'clear-cart',
  CLEAR_BUTTON = 'submit-button_clear',
  CANCEL_BUTTON = 'submit-button_cancel',
}

export default class ClearDialog extends ModalDialog {
  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);

    const template = createTemplate(html);
    const content = template.content.cloneNode(true);
    this.$(classSelector(CssClasses.CONTENT))?.append(content);

    this.setCallback();
  }

  private setCallback(): void {
    const { CANCEL_BUTTON, CLEAR_BUTTON } = CssClasses;
    this.$(classSelector(CANCEL_BUTTON))?.addEventListener('click', this.close.bind(this));
    this.$(classSelector(CLEAR_BUTTON))?.addEventListener('click', this.setUpdateActions.bind(this));
  }

  protected setUpdateActions(): void {
    const lineItems = <LineItem[]>Store.customerCart?.lineItems;
    const updateActions: MyCartUpdateAction[] = [];
    lineItems.forEach((lineItem) => {
      const lineItemId = lineItem.id;
      updateActions.push({
        action: UpdateActions.CHANGE_LINE_ITEM_QUANTITY,
        lineItemId,
        quantity: 0,
      });
    });
    this.clearShoppingCart(updateActions).then().catch(console.error);
  }

  protected async clearShoppingCart(actions: MyCartUpdateAction[]): Promise<void> {
    const cart = Store.customerCart as Cart;
    const { version, id } = cart;
    const body: MyCartUpdate = {
      version,
      actions,
    };
    try {
      const newCart = await updateCart(id, body);
      Store.customerCart = newCart;
      dispatch('itemdelete');
      this.close();
    } catch (error) {
      const activeCart = await getActiveCart();
      Store.customerCart = activeCart;
    }
  }
}
