import { ClientBuilder, type AuthMiddlewareOptions, type HttpMiddlewareOptions } from '@commercetools/sdk-client-v2';
import {
  Project,
  createApiBuilderFromCtpClient,
  ClientResponse,
  ShoppingListPagedQueryResponse,
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

const ctpClient = new ClientBuilder()
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withLoggerMiddleware()
  .build();

const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });

const getProject = async (): Promise<ClientResponse<Project>> => {
  const response = await apiRoot.get().execute();
  return response;
};

const shoppingLists = (): Promise<ClientResponse<ShoppingListPagedQueryResponse>> => {
  return apiRoot.shoppingLists().get().execute();
};

export { getProject, shoppingLists };
