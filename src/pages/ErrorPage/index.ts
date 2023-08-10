import './error.scss';
import html from './error.html';
import createTemplate from '../../utils';

const template = createTemplate(html);

export default class ErrorPage extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}
