import { STORAGE_NAME } from '../config';
import { dispatch } from '../utils/create-element';
import { MerchStore } from '../types/MerchStore';

const Store: MerchStore = {
  customer: undefined,
  token: {
    token: '',
    expirationTime: 0,
    refreshToken: undefined,
  },
  categories: [],
  types: [],
  products: {},
  cart: [],
  customerCart: undefined,
};

const SKIP = ['products'];

type Keys = keyof typeof Store;
type Values = (typeof Store)[Keys];

function loadFromStorage(): void {
  try {
    Object.assign(Store, JSON.parse(localStorage.getItem(STORAGE_NAME) || '{}'));
  } catch (e) {
    console.error(e);
  }
}

function saveToStorage(): void {
  const toSave = Object.fromEntries(Object.entries(Store).filter(([key]) => !SKIP.includes(key)));
  localStorage.setItem(STORAGE_NAME, JSON.stringify(toSave));
}

window.addEventListener('beforeunload', saveToStorage);

loadFromStorage();

const proxiedStore = new Proxy(Store, {
  set(target, property: Keys, value: Values): boolean {
    Reflect.set(target, property, value);

    if (property === 'customer') {
      dispatch('userchange');
    }

    if (property === 'customerCart') {
      dispatch('cartchange');
    }

    return true;
  },
});

export default proxiedStore;
