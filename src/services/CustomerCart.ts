import {
  Address,
  Cart,
  CartDiscountReference,
  CentPrecisionMoney,
  CustomLineItem,
  DirectDiscount,
  DiscountCodeInfo,
  LineItem,
  Shipping,
} from '@commercetools/platform-sdk';
import Price from './Price';

export default class CustomerCart implements Cart {
  public id = '';

  public version = 0;

  public anonymousId?: string | undefined = undefined;

  public lineItems: LineItem[] = [];

  public customLineItems: CustomLineItem[] = [];

  public totalPrice: CentPrecisionMoney = new Price();

  public taxMode = '';

  public taxRoundingMode = '';

  public taxCalculationMode = '';

  public inventoryMode = '';

  public cartState = '';

  public shippingMode = '';

  public shipping: Shipping[] = [];

  public itemShippingAddresses: Address[] = [];

  public discountCodes: DiscountCodeInfo[] = [];

  public directDiscounts: DirectDiscount[] = [];

  public refusedGifts: CartDiscountReference[] = [];

  public origin = '';

  public createdAt = '';

  public lastModifiedAt = '';
}
