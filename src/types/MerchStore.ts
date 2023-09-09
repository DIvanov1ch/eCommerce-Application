import { Category, Customer, ProductProjection, ProductType } from '@commercetools/platform-sdk';
import { TokenStore } from '@commercetools/sdk-client-v2';

export interface MerchStore {
  user: {
    loggedIn: boolean;
    firstName?: string;
    lastName?: string;
  };
  customer: Customer;
  token: TokenStore | null;
  categories: Category[];
  types: ProductType[];
  products: Record<string, ProductProjection>;
  cart: Cart[];
}

export interface Cart {
  key: string;
  quantity: number;
}
