import { Customer } from '@commercetools/platform-sdk';
import { TokenStore } from '@commercetools/sdk-client-v2';

export interface MerchStore {
  user: {
    loggedIn: boolean;
    firstName?: string;
    lastName?: string;
  };
  customer: Customer;
  token: TokenStore | null;
}
