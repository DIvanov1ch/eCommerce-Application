import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './image-slider.scss';
import html from './template.html';
import BaseComponent from '../BaseComponent';
import { createElement } from '../../utils/create-element';
import ModalDialog from '../ModalDialog';

const CssClasses = {
  COMPONENT: 'image-slider',
  SLIDE: 'image-slider__slide',
  SWIPER: 'swiper',
  SWIPER_WRAPPER: 'swiper-wrapper',
  SWIPER_SLIDE: 'swiper-slide',
  SWIPER_BTN_PREV: 'swiper-button-prev',
  SWIPER_BTN_NEXT: 'swiper-button-next',
  MODAL: 'image-slider--modal',
};

const classSelector = (name: string): string => `.${name}`;

export default class ImageSlider extends BaseComponent {
  #images: string[] = [];

  #swiper: Swiper | null = null;

  #modal = false;

  #initialSlide = 0;

  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(CssClasses.COMPONENT);
    this.render();
  }

  private render(): void {
    const { SLIDE, SWIPER, SWIPER_SLIDE, SWIPER_WRAPPER, SWIPER_BTN_PREV, SWIPER_BTN_NEXT, MODAL } = CssClasses;

    const slides = this.#images.map((src) => {
      return createElement('div', { className: `${SWIPER_SLIDE} ${SLIDE}` }, createElement('img', { src, alt: '' }));
    });

    const wrapper = this.$(`.${SWIPER_WRAPPER}`);
    wrapper?.replaceChildren(...slides);

    const swiperElement = this.$(classSelector(SWIPER));
    if (!swiperElement) {
      return;
    }

    if (this.#swiper) {
      this.#swiper.update();
      return;
    }

    this.#swiper = new Swiper(swiperElement, {
      modules: [Navigation],
      loop: true,
      navigation: {
        nextEl: this.$(classSelector(SWIPER_BTN_NEXT)),
        prevEl: this.$(classSelector(SWIPER_BTN_PREV)),
      },
      initialSlide: this.#initialSlide,
    });

    if (this.#modal) {
      this.classList.add(MODAL);
      wrapper?.addEventListener('click', this.handleSlideClicks.bind(this));
    }
  }

  private handleSlideClicks(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const slide = target.closest(`.${CssClasses.SLIDE}`);
    if (!(slide instanceof HTMLElement)) {
      return;
    }

    const slideIndex = slide.dataset.swiperSlideIndex;
    if (slideIndex) {
      this.showInModal(slideIndex);
    }
  }

  private showInModal(slideIndex: string): void {
    const modal = new ModalDialog();
    const slider = new ImageSlider();
    slider.setImages(this.#images.join(';'));
    slider.setAttribute('slide', slideIndex);

    modal.setContent([slider]);
    modal.show();
  }

  private attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'images') {
      this.setImages(newValue);
    }

    if (name === 'modal') {
      this.#modal = !!newValue;
    }

    if (name === 'slide') {
      this.#initialSlide = +newValue;
    }
  }

  private static get observedAttributes(): string[] {
    return ['images', 'modal', 'slide'];
  }

  public setImages(imagesString: string): void {
    this.#images = imagesString.split(';');
    this.render();
  }
}
