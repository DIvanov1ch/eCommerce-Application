import { TokenStore } from '@commercetools/sdk-client-v2';

export interface MerchStore {
  user: {
    loggedIn: boolean;
    firstName?: string;
    lastName?: string;
  };
  token: TokenStore | null;
}
