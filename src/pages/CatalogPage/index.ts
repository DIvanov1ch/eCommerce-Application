import './index.scss';
import html from './catalog.html';
import Page from '../Page';
import { getInfoOfAllProducts } from '../../services/API';
import { createFilterBars, createProductCard } from './functions';

export default class CatalogPage extends Page {
  constructor() {
    super(html);
    getInfoOfAllProducts()
      .then(({ body }) => {
        createProductCard(body.results);
        createFilterBars();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  protected connectedCallback(): void {
    super.connectedCallback();
  }
}
