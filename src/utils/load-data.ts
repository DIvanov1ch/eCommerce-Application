import { getCategories, getCustomer, getProductTypes } from '../services/API';
import Store from '../services/Store';

export async function loadProductCategories(): Promise<void> {
  const response = await getCategories();
  Store.categories = response.results;
}

export async function loadProductTypes(): Promise<void> {
  const response = await getProductTypes();
  Store.types = response.results;
}

export async function loadCustomer(): Promise<void> {
  const customer = await getCustomer();
  Store.customer = customer;
}
