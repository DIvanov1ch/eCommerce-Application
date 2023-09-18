import './team-member.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import { classSelector, createElement } from '../../utils/create-element';
import { Member } from '../../types/Member';
import noImage from '../../assets/photo/no-img.png';

const CssClasses = {
  COMPONENT: 'member',
  PHOTO: 'member__photo',
  IMAGE: 'member__image',
  INFO: 'member__info',
  NAME: 'member__name',
  LOCATION: 'member__location',
  ROLES: 'member__roles',
  BIO: 'member__bio',
  LINKS: 'member__links',
  GITHUB: 'member__link--github',
};

const paragraphs = (text: string): string =>
  text
    .split('\n')
    .map((line) => `<p>${line}</p>`)
    .join('\n');

export default class TeamMember extends BaseComponent {
  #member: Partial<Member>;

  constructor(member: Partial<Member>) {
    super(html);
    this.#member = member;
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.render();
  }

  private render(): void {
    const { PHOTO, IMAGE, INFO, NAME, LOCATION, ROLES, BIO, LINKS, GITHUB } = CssClasses;
    const { photoUrl, fullName, location, roles, bio, githubName } = this.#member;
    const src = photoUrl || noImage;
    const photo = createElement('img', { src, className: IMAGE });

    let link;
    if (githubName) {
      link = createElement(
        'a',
        { className: GITHUB, href: `https://github.com/${githubName}`, target: '_blank' },
        githubName
      );
    }

    const info = [
      fullName ? createElement('h3', { className: NAME }, fullName) : '',
      location ? createElement('div', { className: LOCATION }, location) : '',
      roles && roles.length ? createElement('div', { className: ROLES }, roles.join(', ')) : '',
      bio ? createElement('div', { className: BIO, innerHTML: paragraphs(bio) }) : '',
      link ? createElement('div', { className: LINKS }, link) : '',
    ].filter((e) => e);

    this.$(classSelector(PHOTO))?.append(photo);
    this.$(classSelector(INFO))?.replaceChildren(...info);
  }
}
