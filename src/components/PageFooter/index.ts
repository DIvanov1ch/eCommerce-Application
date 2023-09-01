import './footer.scss';
import html from './footer.html';
import BaseComponent from '../BaseComponent';

export default class PageFooter extends BaseComponent {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('footer');
  }
}
