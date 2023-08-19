import { TokenStore, TokenCache } from '@commercetools/sdk-client-v2';

class TokenClient implements TokenCache {
  private object: TokenStore;

  constructor() {
    this.object = { token: '', expirationTime: 0, refreshToken: '' };
  }

  public get(): TokenStore {
    return this.object;
  }

  public set(newObject: TokenStore): void {
    this.object = newObject;
  }
}

export default TokenClient;
