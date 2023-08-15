import './project.scss';
import html from './project.html';
import { getProject } from '../../services/API';
import Page from '../Page';

export default class ProjectPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
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
