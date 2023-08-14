import './project.scss';
import html from './project.html';
import createTemplate from '../../utils';
import { getProject } from '../../services/API';

const template = createTemplate(html);

export default class ProjectPage extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
    this.showProjectInfo();
  }

  private showProjectInfo(): void {
    const pre = this.querySelector('pre');
    if (!pre) {
      return;
    }

    getProject()
      .then((projectInfo) => {
        pre.innerHTML = JSON.stringify(projectInfo, null, 2);
      })
      .catch(console.error);
  }
}
