import PageMain from '../components/PageMain';

class Router {
  #routes: Record<string, string> = {
    catalog: 'catalog-page',
    profile: 'user-profile',
  };

  #main!: PageMain | null;

  public init(): void {
    this.#main = document.querySelector('page-main');

    window.addEventListener('hashchange', () => {
      this.go(window.location.hash);
    });

    this.go(window.location.hash);
  }

  private go(hash: string): void {
    const route = hash.slice(1);
    const [root, ...params] = route.split('/');
    const [foundRoute = null, page = ''] = Object.entries(this.#routes).find(([key]) => root === key) || [];

    if (foundRoute === null) {
      this.errorPage();
      return;
    }

    this.render(page, params.join('/'));
  }

  private render(page: string, params = ''): void {
    this.clear();

    const pageElement = document.createElement(page);
    if (params) {
      pageElement.setAttribute('params', params);
    }
    this.#main?.append(pageElement);
  }

  private clear(): void {
    this.#main?.clear();
  }

  public errorPage(): void {
    this.clear();
    this.render('error-page');
  }

  public registerRoute(route: string, page: string): void {
    this.#routes[route] = page;
  }
}

export default new Router();
