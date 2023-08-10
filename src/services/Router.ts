import { StateData } from '../types/StateData';

export default class Router {
  #start = '/';

  #routes: Record<string, string> = {
    '/': 'home-page',
    '/login': 'login-page',
    '/registration': 'registration-page',
  };

  #main: HTMLElement | null;

  constructor() {
    this.#main = document.querySelector('page-main');
  }

  public init(): void {
    window.addEventListener('click', (event) => {
      const { target } = event;
      if (target instanceof HTMLAnchorElement) {
        event.preventDefault();
        this.go(target.pathname);
      }
    });

    window.addEventListener('popstate', (event) => {
      const { route } = event.state as StateData;
      if (route) {
        this.go(route, false);
      }
    });

    this.go(window.location.pathname);
  }

  private go(route: string, addToHistory = true): void {
    if (addToHistory) {
      const stateData: StateData = { route };
      window.history.pushState(stateData, '', route);
    }

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
