import {
  ClientBuilder,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
  PasswordAuthMiddlewareOptions,
  Client,
} from '@commercetools/sdk-client-v2';
import {
  Project,
  createApiBuilderFromCtpClient,
  ClientResponse,
  ShoppingListPagedQueryResponse,
  CustomerSignInResult,
  BaseAddress,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { API_HOST, API_SCOPES, PROJECT_KEY, CLIENT_ID, CLIENT_SECRET, API_REGION, AUTH_HOST } from '../config';
import TokenClient from './Token';

const projectKey = PROJECT_KEY;
const scopes = [API_SCOPES.map((scope) => `${scope}:${PROJECT_KEY}`).join(' ')];
const authHost = AUTH_HOST.replace('{region}', API_REGION);
const apiHost = API_HOST.replace('{region}', API_REGION);

const newToken = new TokenClient();

const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: authHost,
  projectKey,
  credentials: { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
  scopes,
  tokenCache: newToken,
  fetch,
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

const ctpClient = new ClientBuilder()
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withLoggerMiddleware()
  .build();

const getApiRoot = (client: Client): ByProjectKeyRequestBuilder => {
  const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });
  return apiRoot;
};

const passwordFlowClient = (username: string, password: string, token: TokenClient): Client => {
  const newCtpClient = new ClientBuilder()
    .withPasswordFlow(getPasswordFlowOptions(username, password, token))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return newCtpClient;
};

const getProject = async (): Promise<ClientResponse<Project>> => {
  const response = await getApiRoot(ctpClient).get().execute();
  return response;
};

const shoppingLists = (): Promise<ClientResponse<ShoppingListPagedQueryResponse>> => {
  return getApiRoot(ctpClient).shoppingLists().get().execute();
};

const login = async (userEmail: string, userPassword: string): Promise<ClientResponse<CustomerSignInResult>> => {
  const newApiRoot = createApiBuilderFromCtpClient(
    passwordFlowClient(userEmail, userPassword, newToken)
  ).withProjectKey({
    projectKey,
  });
  return newApiRoot
    .me()
    .login()
    .post({ body: { email: userEmail, password: userPassword } })
    .execute();
};

const getClientCredentialsFlowClient = (): Client => {
  const clientCredentialsFlowClient = new ClientBuilder()
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return clientCredentialsFlowClient;
};

const registration = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  dateOfBirth: string,
  addresses: BaseAddress[],
  defaultShippingAddress: number | undefined,
  shippingAddresses: number[],
  defaultBillingAddress: number | undefined,
  billingAddresses: number[]
): Promise<ClientResponse<CustomerSignInResult>> => {
  const apiRoot = getApiRoot(getClientCredentialsFlowClient());
  return apiRoot
    .customers()
    .post({
      body: {
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        addresses,
        defaultShippingAddress,
        shippingAddresses,
        defaultBillingAddress,
        billingAddresses,
      },
    })
    .execute();
};

const logout = (): void => {
  newToken.delete();
};

export { getProject, shoppingLists, login, registration, logout };
