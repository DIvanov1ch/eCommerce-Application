import { TokenStore, TokenCache } from '@commercetools/sdk-client-v2';

class TokenClient implements TokenCache {
  private object: TokenStore;

  constructor() {
    this.object = {
      token: localStorage.getItem('userToken') || '',
      expirationTime: Number(localStorage.getItem('userTokenExpirationTime')),
      refreshToken: localStorage.getItem('userRefreshToken') || '',
    };
  }

  public get(): TokenStore {
    return this.object;
  }

  public set(newObject: TokenStore): void {
    this.object = newObject;
    localStorage.setItem('userToken', this.object.token);
    localStorage.setItem('userTokenExpirationTime', this.object.expirationTime.toString());
    localStorage.setItem('userRefreshToken', this.object.refreshToken || '');
  }

  public delete = (): void => {
    this.object = { token: '', expirationTime: 0, refreshToken: '' };
    localStorage.removeItem('userToken');
    localStorage.removeItem('userTokenExpirationTime');
    localStorage.removeItem('userRefreshToken');
  };
}

export default TokenClient;
