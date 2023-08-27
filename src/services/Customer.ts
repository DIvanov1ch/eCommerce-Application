import { BaseAddress, CustomerDraft } from '@commercetools/platform-sdk';

export default class Customer implements CustomerDraft {
  public firstName: string | undefined;

  public lastName: string | undefined;

  public email: string;

  public password: string;

  public dateOfBirth: string | undefined;

  public addresses: BaseAddress[] | undefined;

  public defaultShippingAddress: number | undefined;

  public shippingAddresses: number[] | undefined;

  public defaultBillingAddress: number | undefined;

  public billingAddresses: number[] | undefined;

  constructor() {
    this.email = '';
    this.password = '';
  }
}
