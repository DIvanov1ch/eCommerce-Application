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
} from '@commercetools/platform-sdk';
import { API_HOST, API_SCOPES, PROJECT_KEY, CLIENT_ID, CLIENT_SECRET, API_REGION, AUTH_HOST } from '../config';

const projectKey = PROJECT_KEY;
const scopes = [API_SCOPES.map((scope) => `${scope}:${PROJECT_KEY}`).join(' ')];
const authHost = AUTH_HOST.replace('{region}', API_REGION);
const apiHost = API_HOST.replace('{region}', API_REGION);

const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: authHost,
  projectKey,
  credentials: { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
  scopes,
  fetch,
};

const httpMiddlewareOptions: HttpMiddlewareOptions = { host: apiHost, fetch };

const getPasswordFlowOptions = (username: string, password: string): PasswordAuthMiddlewareOptions => {
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
    scopes,
    fetch,
  };
};

const ctpClient = new ClientBuilder()
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withLoggerMiddleware()
  .build();

const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });

const passwordFlowClient = (username: string, password: string): Client => {
  const newCtpClient = new ClientBuilder()
    .withPasswordFlow(getPasswordFlowOptions(username, password))
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
  return newCtpClient;
};

const getProject = async (): Promise<ClientResponse<Project>> => {
  const response = await apiRoot.get().execute();
  return response;
};

const shoppingLists = (): Promise<ClientResponse<ShoppingListPagedQueryResponse>> => {
  return apiRoot.shoppingLists().get().execute();
};

const login = async (userEmail: string, userPassword: string): Promise<ClientResponse<CustomerSignInResult>> => {
  const newApiRoot = createApiBuilderFromCtpClient(passwordFlowClient(userEmail, userPassword)).withProjectKey({
    projectKey,
  });
  return newApiRoot
    .me()
    .login()
    .post({ body: { email: userEmail, password: userPassword } })
    .execute();
};

export { getProject, shoppingLists, login };
