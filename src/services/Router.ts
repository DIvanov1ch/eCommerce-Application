export default class Router {
  #start = '/';

  #routes: Record<string, string> = {
    '': 'home-page',
    login: 'login-page',
    registration: 'registration-page',
    project: 'project-page',
    'test-login': 'test-login-page',
    'test-logout': 'test-logout-page',
  };

  #main: HTMLElement | null;

  constructor() {
    this.#main = document.querySelector('page-main');
  }

  public init(): void {
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
    if (!this.#main) {
      return;
    }

    this.clear();
    this.#main.append(document.createElement(page));
  }

  private clear(): void {
    if (!this.#main) {
      return;
    }
    [...this.#main.children].forEach((child) => child.remove());
  }

  private errorPage(): void {
    this.clear();
    this.render('error-page');
  }
}
