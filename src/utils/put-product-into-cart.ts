import { LineItemDraft } from '@commercetools/platform-sdk';
import { createNewCart, getActiveCart, updateCart } from '../services/API';
import Store from '../services/Store';

export default async function putProductIntoCart(productKey: string, variantId = 1): Promise<void> {
  const product = Store.products[productKey];
  try {
    const cart = await getActiveCart();
    Store.customerCart = cart;
    const { version } = cart;
    const updatedCart = await updateCart(cart.id, {
      version,
      actions: [{ action: 'addLineItem', productId: product.id, variantId }],
    });
    Store.customerCart = updatedCart;
  } catch (error) {
    const productId = product.id;
    const lineItem: LineItemDraft = { productId, variantId };
    const newCart = await createNewCart([lineItem]);
    Store.customerCart = newCart;
  }
}
