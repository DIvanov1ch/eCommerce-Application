import { login } from '../services/API';
import Store from '../services/Store';

const loginUser = async (email: string, password: string): Promise<void> => {
  const { body } = await login(email, password);
  Store.customer = body.customer;
  Store.customerCart = body.cart;
};

export default loginUser;
