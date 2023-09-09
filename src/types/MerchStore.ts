import { Category, Customer, ProductProjection } from '@commercetools/platform-sdk';
import { TokenStore } from '@commercetools/sdk-client-v2';

export interface MerchStore {
  customer?: Customer;
  token: TokenStore | null;
  categories: Category[];
  products: Record<string, ProductProjection>;
  cart: Cart[];
}

export interface Cart {
  key: string;
  quantity: number;
}
