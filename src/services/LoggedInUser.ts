import { Address, Customer } from '@commercetools/platform-sdk';

export default class LoggedInUser implements Customer {
  public id = '';

  public version = -1;

  public createdAt = '';

  public lastModifiedAt = '';

  public email = '';

  public isEmailVerified = false;

  public authenticationMode = '';

  public addresses: Address[] = [];
}
