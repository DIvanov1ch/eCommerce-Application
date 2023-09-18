import Router from '../../services/Router';
import Page from '../Page';
import html from './template.html';
import './about_us.scss';
import { classSelector } from '../../utils/create-element';
import TeamMember from '../../components/TeamMember';
import { Member } from '../../types/Member';
import phoinix from '../../assets/photo/phoinix.jpg';

Router.registerRoute('about-us', 'about_us-page');

const CssClasses = {
  PAGE: 'about_us',
  MEMBERS: 'about__members',
};

const MEMBERS: Member[] = [
  {
    fullName: 'Dzianis Trukhanovich',
    location: 'Brest, Belarus',
    photoUrl: 'https://i.ibb.co/khyPDVN/My-Image-2-1.png',
    roles: ['Front-end developer'],
    bio: `A detail-oriented Junior, who is eager to absorb information and advice from mentors as a sponge. Looking forward to joining a fast-paced company and use my creativity and experience to improve the overall quality of a product or service.`,
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
    photoUrl: phoinix,
    roles: ['Front-end developer', 'Content Manager'],
    bio: `I've been self-teaching web development for quite some time. I remember crafting \
    HTML files with divs by hand back in the days when tables dominated the web.\
    I've witnessed the existence of libraries that Gen Z wouldn't believe were once prevalent.
    Fortunately, fate guided me to RSSchool, where I am now learning the true path of web development.`,
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
