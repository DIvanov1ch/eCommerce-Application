import { Cart } from '@commercetools/platform-sdk';
import { putProductIntoCart } from './API';
import Store from './Store';

const mergeAnonymousCartWithUserCart = (body: Cart): void => {
  const allProductInUserCart: string[] = [];
  body.lineItems.forEach((el) => {
    if (el.productSlug !== undefined) {
      allProductInUserCart.push(el.productSlug.en || '');
    }
  });
  const newStore: string[] = Store.cart;
  let newProductInAnonymousCart: string[] = [];
  newProductInAnonymousCart = newStore.filter((element) => !allProductInUserCart.includes(element));
  const promise = (i: number): Promise<void> =>
    putProductIntoCart(newProductInAnonymousCart[i], true)
      .then(() => {
        if (i > 1) return promise(i - 1);
        Store.cartiSMerged = true;
        return undefined;
      })
      .catch(() => {});
  promise(newProductInAnonymousCart.length - 1)
    .then(() => {})
    .catch(() => {});
  Store.cart = [];
  Store.cart = [...allProductInUserCart, ...newProductInAnonymousCart];
};

export default mergeAnonymousCartWithUserCart;
