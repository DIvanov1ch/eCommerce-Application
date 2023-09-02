import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './image-slider.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import { createElement } from '../../utils/create-element';

const CssClasses = {
  COMPONENT: 'image-slider',
  SLIDE: 'image-slider__slide',
  SWIPER: 'swiper',
  SWIPER_WRAPPER: 'swiper-wrapper',
  SWIPER_SLIDE: 'swiper-slide',
  SWIPER_BTN_PREV: 'swiper-button-prev',
  SWIPER_BTN_NEXT: 'swiper-button-next',
};

const classSelector = (name: string): string => `.${name}`;

export default class ImageSlider extends BaseComponent {
  #images: string[] = [];

  #swiper: Swiper | null = null;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.render();
  }

  private render(): void {
    const { SLIDE, SWIPER, SWIPER_SLIDE, SWIPER_WRAPPER, SWIPER_BTN_PREV, SWIPER_BTN_NEXT } = CssClasses;

    const slides = this.#images.map((src) => {
      return createElement('div', { className: `${SWIPER_SLIDE} ${SLIDE}` }, createElement('img', { src, alt: '' }));
    });

    this.$(`.${SWIPER_WRAPPER}`)?.replaceChildren(...slides);

    const swiperElement = this.$(classSelector(SWIPER));
    if (!swiperElement) {
      return;
    }

    if (this.#swiper) {
      this.#swiper.update();
    } else {
      this.#swiper = new Swiper(swiperElement, {
        modules: [Navigation],
        loop: true,
        navigation: {
          nextEl: this.$(classSelector(SWIPER_BTN_NEXT)),
          prevEl: this.$(classSelector(SWIPER_BTN_PREV)),
        },
      });
    }
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'images') {
      this.setImages(newValue);
    }
  }

  private static get observedAttributes(): string[] {
    return ['images'];
  }

  public setImages(imagesString: string): void {
    this.#images = imagesString.split(';');
    this.render();
  }
}
