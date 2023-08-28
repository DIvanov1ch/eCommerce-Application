import PageMain from '../components/PageMain';

class Router {
  #routes: Record<string, string> = {
    '': 'home-page',
    login: 'login-page',
    registration: 'registration-page',
    project: 'project-page',
    catalog: 'catalog-page',
    logout: 'logout-page',
    'test-login': 'test-login-page',
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

    if (!(route in this.#routes)) {
      this.errorPage();
      return;
    }

    const page = this.#routes[route];
    this.render(page);
  }

  private render(page: string): void {
    this.clear();
    this.#main?.append(document.createElement(page));
  }

  private clear(): void {
    this.#main?.clear();
  }

  private errorPage(): void {
    this.clear();
    this.render('error-page');
  }
}

export default new Router();
