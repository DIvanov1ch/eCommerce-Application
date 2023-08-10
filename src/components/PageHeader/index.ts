import './header.scss';
import html from './header.html';
import createTemplate from '../../utils';

const template = createTemplate(html);

export default class PageHeader extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}
