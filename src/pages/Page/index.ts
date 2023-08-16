import BaseComponent from '../../components/BaseComponent';
import { APP_NAME } from '../../config';

export default class Page extends BaseComponent {
  #pageTitle: string;

  constructor(html: string, title = '') {
    super(html);
    this.#pageTitle = title;
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    document.title = [APP_NAME, this.#pageTitle].filter((e) => e).join(': ');
  }
}
