import Router from '../../services/Router';
import Page from '../Page';
import html from './template.html';
import './about_us.scss';
import { classSelector } from '../../utils/create-element';
import TeamMember from '../../components/TeamMember';
import { Member } from '../../types/Member';

Router.registerRoute('about-us', 'about_us-page');

const CssClasses = {
  PAGE: 'about_us',
  MEMBERS: 'about__members',
};

const MEMBERS: Member[] = [
  {
    fullName: '',
    location: '',
    photoUrl: '',
    roles: ['Front-end developer'],
    bio: ``,
    githubName: 'DIvanov1ch',
  },

  {
    fullName: 'Aliaksandr Ipatau',
    location: 'Brest, Belarus',
    photoUrl: 'https://avatars.githubusercontent.com/u/11777183',
    roles: ['Front-end developer'],
    bio: `I started to study coding last year and with the help of RSSchool\
    I understood that it is very interesting activity.\
    I hope that my diligence and assiduousness will help me to change my life\
    and I'll become a professional programmer.`,
    githubName: 'beskibeski',
  },
  {
    fullName: 'Vitaly Kukushkin',
    location: 'Kaliningrad, Russia',
    photoUrl: 'https://avatars.githubusercontent.com/u/1216630',
    roles: ['Front-end developer', 'Content Manager'],
    bio: `I've been learning web development on my own from the times immemorial.\
    I've been crafting html files with div's by hands when tables dominated the web.\
    I've seen libraries, you gen-z would not believe existed.
    Luckily The Force lead me to the RSSchool and now I am learning the true Path...
    Blah-blah-blah...`,
    githubName: 'phoinixru',
  },
];

export default class AboutUsPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.PAGE);
    this.render();
  }

  private render(): void {
    this.$(classSelector(CssClasses.MEMBERS))?.append(...MEMBERS.map((member) => new TeamMember(member)));
  }
}
