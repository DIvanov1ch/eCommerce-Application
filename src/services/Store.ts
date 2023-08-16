import { dispatch } from '../utils';

const Store = {
  user: {
    loggedIn: false,
  },
};

type Keys = keyof typeof Store;
type Values = (typeof Store)[Keys];

const proxiedStore = new Proxy(Store, {
  set(_, property: Keys, value: Values): boolean {
    Store[property] = value;

    if (property === 'user') {
      dispatch('userchange');
    }
    return true;
  },
});

export default proxiedStore;
