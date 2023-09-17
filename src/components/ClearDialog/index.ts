import { MyCartUpdateAction } from '@commercetools/platform-sdk';
import { classSelector, createTemplate, dispatch } from '../../utils/create-element';
import ModalDialog from '../ModalDialog';
import html from './template.html';
import './clear-dialog.scss';
import Store from '../../services/Store';
import { updateCart } from '../../services/API';
import showToastMessage from '../../utils/show-toast-message';
import UpdateActions from '../../enums/update-actions';

enum CssClasses {
  CONTENT = 'modal__content',
  COMPONENT = 'clear-cart',
  CLEAR_BUTTON = 'submit-button_clear',
  CANCEL_BUTTON = 'submit-button_cancel',
}

const ToastMessage = {
  CART_CLEARED: 'Your shopping cart has been cleared',
  ERROR: 'Something went wrong',
};

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
    this.$(classSelector(CLEAR_BUTTON))?.addEventListener('click', () => {
      ClearDialog.clearShoppingCart()
        .then()
        .catch(() => {
          showToastMessage(ToastMessage.ERROR, false);
        });
      this.close.bind(this);
    });
  }

  protected static async clearShoppingCart(): Promise<void> {
    if (!Store.customerCart) {
      showToastMessage(ToastMessage.ERROR, false);
      return;
    }
    const { CHANGE_LINE_ITEM_QUANTITY } = UpdateActions;
    const { lineItems, id, version } = Store.customerCart;
    const actions: MyCartUpdateAction[] = [];
    lineItems.forEach((lineItem) => {
      const lineItemId = lineItem.id;
      actions.push({ action: CHANGE_LINE_ITEM_QUANTITY, lineItemId, quantity: 0 });
    });

    const updatedCart = await updateCart(id, { version, actions });
    Store.customerCart = updatedCart;
    dispatch('itemdelete');
    showToastMessage(ToastMessage.CART_CLEARED, true);
  }
}
