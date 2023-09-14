import { getActiveCart, login } from '../services/API';
import Store from '../services/Store';

const loginUser = async (email: string, password: string): Promise<void> => {
  const { body } = await login(email, password);
  getActiveCart()
    .then(({ lineItems }) => {
      lineItems.forEach((el) => {
        if (el.productSlug !== undefined) {
          Store.cart.push(el.productSlug.en);
        }
      });
    })
    .catch(() => {});
  Store.customer = body.customer;
};

export default loginUser;
