import { STORAGE_NAME } from '../config';
import { dispatch } from '../utils/create-element';
import { MerchStore } from '../types/MerchStore';

const Store: MerchStore = {
  user: {
    loggedIn: false,
  },
  token: {
    token: '',
    expirationTime: 0,
    refreshToken: undefined,
  },
};

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
  localStorage.setItem(STORAGE_NAME, JSON.stringify(Store));
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
