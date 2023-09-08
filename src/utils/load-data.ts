import { getCategories, getCustomer } from '../services/API';
import Store from '../services/Store';

export default async function loadProductCategories(): Promise<void> {
  const response = await getCategories();
  Store.categories = response.results;
}

export async function loadCustomer(): Promise<void> {
  const customer = await getCustomer();
  Store.customer = customer;
}
