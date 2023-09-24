import {
  ClientBuilder,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
  PasswordAuthMiddlewareOptions,
  Client,
  AnonymousAuthMiddlewareOptions,
} from '@commercetools/sdk-client-v2';
import {
  createApiBuilderFromCtpClient,
  ClientResponse,
  CustomerSignInResult,
  CustomerDraft,
  ProductProjectionPagedSearchResponse,
  ProductProjection,
  CategoryPagedQueryResponse,
  ProductTypePagedQueryResponse,
  Customer,
  MyCustomerUpdate,
  MyCustomerChangePassword,
  Cart,
  MyCartUpdate,
  LineItemDraft,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  API_HOST,
  API_SCOPES,
  PROJECT_KEY,
  CLIENT_ID,
  CLIENT_SECRET,
  API_REGION,
  AUTH_HOST,
  CATEGORIES_LIMIT,
  PRODUCTS_PER_PAGE,
  Country,
} from '../config';
import TokenClient from './Token';
import { FilterSortingSearchQueries } from '../types/Catalog';
import Store from './Store';

const projectKey = PROJECT_KEY;
const scopes = [API_SCOPES.map((scope) => `${scope}:${PROJECT_KEY}`).join(' ')];
const authHost = AUTH_HOST.replace('{region}', API_REGION);
const apiHost = API_HOST.replace('{region}', API_REGION);
const searchFilter = 'text.en';

const tokenClient = new TokenClient();

const getAuthMiddlewareOptions = (token: TokenClient): AuthMiddlewareOptions => {
  return {
    host: authHost,
    projectKey,
    credentials: { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
    scopes,
    tokenCache: token,
    fetch,
  };
};

const httpMiddlewareOptions: HttpMiddlewareOptions = { host: apiHost, fetch };

const getPasswordFlowOptions = (
  username: string,
  password: string,
  token: TokenClient
): PasswordAuthMiddlewareOptions => {
  return {
    host: authHost,
    projectKey,
    credentials: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      user: {
        username,
        password,
      },
    },
    tokenCache: token,
    scopes,
    fetch,
  };
};

const getAnonymousMiddlewareOptions = (token: TokenClient): AnonymousAuthMiddlewareOptions => {
  return {
    host: authHost,
    projectKey,
    credentials: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    },
    scopes,
    fetch,
    tokenCache: token,
  };
};

const getApiRoot = (client: Client): ByProjectKeyRequestBuilder => {
  const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });
  return apiRoot;
};

const getClientCredentialsFlowClient = (): Client => {
  const clientCredentialsFlowClient = new ClientBuilder()
    .withClientCredentialsFlow(getAuthMiddlewareOptions(tokenClient))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return clientCredentialsFlowClient;
};

const getPasswordFlowClient = (username: string, password: string): Client => {
  const passwordFlowClient = new ClientBuilder()
    .withPasswordFlow(getPasswordFlowOptions(username, password, tokenClient))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return passwordFlowClient;
};

const getAnonymousFlowClient = (): Client => {
  const anonymousFlowClient = new ClientBuilder()
    .withAnonymousSessionFlow(getAnonymousMiddlewareOptions(tokenClient))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return anonymousFlowClient;
};

const login = async (email: string, password: string): Promise<ClientResponse<CustomerSignInResult>> => {
  if (Store.token) {
    tokenClient.delete();
  }
  const anonymousId = Store.customerCart?.anonymousId;
  const apiRoot = getApiRoot(getPasswordFlowClient(email, password));
  return apiRoot.login().post({ body: { email, password, anonymousId } }).execute();
};

const registerCustomer = async (body: CustomerDraft): Promise<ClientResponse<CustomerSignInResult>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.customers().post({ body }).execute();
};

const logout = (): void => {
  Store.customerCart = undefined;
  Store.customer = undefined;
  tokenClient.delete();
};

async function getInfoOfFilteredProducts({
  filterQuery,
  sortingQuery,
  searchQuery,
  limit = PRODUCTS_PER_PAGE,
  offset = 0,
}: FilterSortingSearchQueries): Promise<ProductProjectionPagedSearchResponse> {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  const queryArgs = {
    offset,
    limit,
    filter: filterQuery,
    sort: sortingQuery,
    [searchFilter]: searchQuery,
  };
  return (await apiRoot.productProjections().search().get({ queryArgs }).execute()).body;
}

async function getProductProjectionByKey(key: string): Promise<ProductProjection> {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());

  return (await apiRoot.productProjections().withKey({ key }).get().execute()).body;
}

async function getCategories(): Promise<CategoryPagedQueryResponse> {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  const queryArgs = { limit: CATEGORIES_LIMIT };

  return (await apiRoot.categories().get({ queryArgs }).execute()).body;
}

async function getProductTypes(): Promise<ProductTypePagedQueryResponse> {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());

  return (await apiRoot.productTypes().get().execute()).body;
}

async function getCustomer(): Promise<Customer> {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return (await apiRoot.me().get().execute()).body;
}

const updateCustomer = async (body: MyCustomerUpdate): Promise<ClientResponse<Customer>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.me().post({ body }).execute();
};

const changePassword = async (body: MyCustomerChangePassword): Promise<ClientResponse<Customer>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.me().password().post({ body }).execute();
};

const getCartByCustomerId = async (customerId: string): Promise<Cart> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return (
    await apiRoot
      .carts()
      .withCustomerId({
        customerId,
      })
      .get()
      .execute()
  ).body;
};

const createNewCart = async (lineItems: LineItemDraft[] | undefined = undefined): Promise<Cart> => {
  tokenClient.delete();
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return (
    await apiRoot
      .me()
      .carts()
      .post({
        body: {
          currency: 'USD',
          country: Country.UnitedStates,
          lineItems,
        },
      })
      .execute()
  ).body;
};

async function getActiveCart(): Promise<Cart> {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return (await apiRoot.me().activeCart().get().execute()).body;
}

const updateCart = async (id: string, body: MyCartUpdate): Promise<Cart> => {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return (await apiRoot.me().carts().withId({ ID: id }).post({ body }).execute()).body;
};

export {
  login,
  registerCustomer,
  logout,
  getProductProjectionByKey,
  getCategories,
  getInfoOfFilteredProducts,
  getProductTypes,
  updateCustomer,
  changePassword,
  createNewCart,
  getActiveCart,
  getCustomer,
  getCartByCustomerId,
  updateCart,
};
