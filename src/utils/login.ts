import { login, getActiveCart, createNewCart } from '../services/API';
import Store from '../services/Store';
import mergeAnonymousCartWithUserCart from '../services/cart-merge';
import { errorsClient } from '../types/errors';

const loginUser = async (email: string, password: string): Promise<void> => {
  const { body } = await login(email, password);
  Store.customer = body.customer;
  getActiveCart()
    .then(({ body: body_1 }) => mergeAnonymousCartWithUserCart(body_1))
    .catch((error: Error) => {
      if (error.name === errorsClient.noCart) {
        createNewCart()
          .then(() =>
            getActiveCart()
              .then(({ body: body_3 }) => {
                mergeAnonymousCartWithUserCart(body_3);
              })
              .catch(() => {})
          )
          .catch(() => {});
      }
    });
};

export default loginUser;
