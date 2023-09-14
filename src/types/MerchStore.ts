import { Cart, Category, Customer, ProductProjection, ProductType } from '@commercetools/platform-sdk';
import { TokenStore } from '@commercetools/sdk-client-v2';

export interface MerchStore {
  customer?: Customer;
  token: TokenStore | null;
  categories: Category[];
  types: ProductType[];
  products: Record<string, ProductProjection>;
  cart: string[];
  customerCart?: Cart;
}
