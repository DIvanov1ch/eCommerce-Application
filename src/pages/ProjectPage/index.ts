import './project.scss';
import html from './project.html';
import { getProject } from '../../services/API';
import Page from '../Page';

const PAGE_TITLE = 'Project Info';

export default class ProjectPage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
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
