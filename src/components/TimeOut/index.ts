import './timeout.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';

const ONE_SECOND = 1000;

export default class TimeOut extends BaseComponent {
  private timerId = 0;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    let sec = Number(this.getAttribute('time'));

    this.update(sec);
    this.timerId = window.setInterval(() => {
      sec -= 1;
      this.update(sec);
    }, ONE_SECOND);
  }

  private disconnectedCallback(): void {
    window.clearTimeout(this.timerId);
  }

  private update(value: number): void {
    const time = Math.max(0, value);
    this.innerText = `${time}`;
  }
}
