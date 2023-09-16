import { LineItem, MyCartUpdateAction } from '@commercetools/platform-sdk';
import Store from '../services/Store';
import { createNewCart, getActiveCart, updateCart } from '../services/API';
import throwError from './throw-error';

function lineItemInCart(productKey: string, variantId = 1, cart = Store.customerCart): LineItem | null {
  if (!cart) return null;
  return cart.lineItems.find((item) => item.productKey === productKey && item.variant.id === variantId) || null;
}

async function updateActiveCart(actions: MyCartUpdateAction[] = []): Promise<void> {
  let cart;
  try {
    cart = await getActiveCart();
  } catch (e) {
    cart = await createNewCart();
  }

  if (!cart) {
    throwError(new Error('Could not update cart'));
  }

  const { id, version } = cart;
  const updatedCart = await updateCart(id, { version, actions });

  Store.customerCart = updatedCart;
}

async function addLineItem(productId: string, variantId = 1, quantity = 1): Promise<void> {
  await updateActiveCart([{ action: 'addLineItem', productId, variantId, quantity }]);
}

async function changeLineItemQuantity(lineItemId: LineItem['id'], quantity: number): Promise<void> {
  await updateActiveCart([{ action: 'changeLineItemQuantity', lineItemId, quantity }]);
}

async function removeLineItem(lineItemId: LineItem['id']): Promise<void> {
  await changeLineItemQuantity(lineItemId, 0);
}

export { lineItemInCart, addLineItem, removeLineItem, changeLineItemQuantity, updateActiveCart };
