import { Address, Customer } from '@commercetools/platform-sdk';

export default class LoggedInUser implements Customer {
  public id: string;

  public version: number;

  public createdAt: string;

  public lastModifiedAt: string;

  public email: string;

  public isEmailVerified: boolean;

  public authenticationMode: string;

  public addresses: Address[];

  constructor() {
    this.id = '';
    this.version = -1;
    this.email = '';
    this.createdAt = '';
    this.lastModifiedAt = '';
    this.addresses = [];
    this.isEmailVerified = false;
    this.authenticationMode = '';
  }
}
