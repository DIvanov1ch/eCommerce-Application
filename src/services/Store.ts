import { STORAGE_NAME } from '../config';
import { dispatch } from '../utils/create-element';
import { MerchStore } from '../types/MerchStore';
import LoggedInUser from './LoggedInUser';

const Store: MerchStore = {
  user: {
    loggedIn: false,
  },
  customer: new LoggedInUser(),
  token: {
    token: '',
    expirationTime: 0,
    refreshToken: undefined,
  },
  categories: [],
  types: [],
  products: {},
  cart: [],
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

    if (property === 'user') {
      dispatch('userchange');
    }
    return true;
  },
});

export default proxiedStore;
