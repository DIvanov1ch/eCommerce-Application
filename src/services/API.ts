import {
  ClientBuilder,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
  PasswordAuthMiddlewareOptions,
  Client,
  AnonymousAuthMiddlewareOptions,
  // RefreshAuthMiddlewareOptions,
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
} from '../config';
import TokenClient from './Token';
import { FilterSortingSearchQueries } from '../types/Catalog';
import Store from './Store';
import { errorsClient } from '../types/errors';

const projectKey = PROJECT_KEY;
const scopes = [API_SCOPES.map((scope) => `${scope}:${PROJECT_KEY}`).join(' ')];
const authHost = AUTH_HOST.replace('{region}', API_REGION);
const apiHost = API_HOST.replace('{region}', API_REGION);
const searchFilter = 'text.en';

const newToken = new TokenClient();

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

// const getRefreshTokenFlowOptions = (token: TokenClient): RefreshAuthMiddlewareOptions => {
//   return {
//     host: authHost,
//     projectKey,
//     credentials: {
//       clientId: CLIENT_ID,
//       clientSecret: CLIENT_SECRET,
//     },
//     refreshToken: Store.token?.refreshToken || '',
//     tokenCache: token,
//     fetch,
//   };
// };

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
    .withClientCredentialsFlow(getAuthMiddlewareOptions(newToken))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return clientCredentialsFlowClient;
};

const getPasswordFlowClient = (username: string, password: string): Client => {
  const passwordFlowClient = new ClientBuilder()
    .withPasswordFlow(getPasswordFlowOptions(username, password, newToken))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return passwordFlowClient;
};

// const getRefreshTokenFlowClient = (): Client => {
//   const refreshTokenFlowClient = new ClientBuilder()
//     .withRefreshTokenFlow(getRefreshTokenFlowOptions(newToken))
//     .withHttpMiddleware(httpMiddlewareOptions)
//     .withLoggerMiddleware()
//     .build();
//   return refreshTokenFlowClient;
// };

const getAnonymousFlowClient = (): Client => {
  const anonymousFlowClient = new ClientBuilder()
    .withAnonymousSessionFlow(getAnonymousMiddlewareOptions(newToken))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return anonymousFlowClient;
};

const login = async (email: string, password: string): Promise<ClientResponse<CustomerSignInResult>> => {
  if (Store.token) {
    newToken.delete();
  }
  const apiRoot = getApiRoot(getPasswordFlowClient(email, password));
  return apiRoot.me().login().post({ body: { email, password } }).execute();
};

const registration = async (body: CustomerDraft): Promise<ClientResponse<CustomerSignInResult>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.customers().post({ body }).execute();
};

const logout = (): void => {
  newToken.delete();
  Store.cart = [];
  Store.cartiSMerged = false;
};

const getInfoOfFilteredProducts = async ({
  filterQuery,
  sortingQuery,
  searchQuery,
}: FilterSortingSearchQueries): Promise<ClientResponse<ProductProjectionPagedSearchResponse>> => {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return apiRoot
    .productProjections()
    .search()
    .get({
      queryArgs: {
        limit: 500,
        filter: filterQuery,
        sort: sortingQuery,
        [searchFilter]: searchQuery,
      },
    })
    .execute();
};

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

const update = async (body: MyCustomerUpdate): Promise<ClientResponse<Customer>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.me().post({ body }).execute();
};

const changePassword = async (body: MyCustomerChangePassword): Promise<ClientResponse<Customer>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot.me().password().post({ body }).execute();
};

const getCart = async (): Promise<Cart> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  const customerId = Store.customer?.id as string;
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

const createNewCart = async (): Promise<ClientResponse<Cart>> => {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return apiRoot
    .me()
    .carts()
    .post({
      body: {
        currency: 'USD',
        country: 'US',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .execute();
};

async function getActiveCart(): Promise<ClientResponse<Cart>> {
  const apiRoot = getApiRoot(getAnonymousFlowClient());
  return apiRoot.me().activeCart().get().execute().catch();
}

async function putProductIntoCart(product: string, hasCart = false): Promise<ClientResponse<Cart>> {
  if (hasCart === false) {
    await getActiveCart().catch((error: Error) => {
      if (error.name === errorsClient.noCart) {
        createNewCart()
          .then(() => {})
          .catch(() => {});
      }
      if (error.name === errorsClient.wrongToken) {
        newToken.delete();
        createNewCart()
          .then(() => {})
          .catch(() => {});
      }
    });
  }
  const productId = (await getProductProjectionByKey(product)).id;
  const { id, version } = (await getActiveCart()).body;
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot
    .me()
    .carts()
    .withId({ ID: id })
    .post({
      body: {
        version,
        actions: [
          {
            action: 'addLineItem',
            productId,
          },
        ],
      },
    })
    .execute();
}

export {
  login,
  registration,
  logout,
  getProductProjectionByKey,
  getCategories,
  getInfoOfFilteredProducts,
  getProductTypes,
  update,
  changePassword,
  createNewCart,
  getActiveCart,
  putProductIntoCart,
  getCustomer,
  getCart,
};
