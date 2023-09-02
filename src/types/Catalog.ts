export type FiltersType = {
  price?: string;
  material?: string;
  brand?: string;
  color?: string;
  size?: string;
  byPrice?: string;
  byName?: string;
};

export type FilterSortingSearchQueries = {
  filterQuery?: string[];
  sortingQuery?: string[];
  searchQuery?: string;
};
