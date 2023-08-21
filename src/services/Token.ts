import { TokenStore, TokenCache } from '@commercetools/sdk-client-v2';
import Store from './Store';

const emptyTokenStore: TokenStore = {
  token: '',
  expirationTime: 0,
  refreshToken: '',
};

class TokenClient implements TokenCache {
  private object: TokenStore;

  constructor() {
    this.object = Store.token || { ...emptyTokenStore };
  }

  public get(): TokenStore {
    return this.object;
  }

  public set(newObject: TokenStore): void {
    this.object = newObject;
    Store.token = newObject;
  }

  public delete = (): void => {
    this.object = { ...emptyTokenStore };
    Store.token = null;
  };
}

export default TokenClient;
