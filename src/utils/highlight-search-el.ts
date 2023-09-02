const MINELEMENTLENGTHTOHIGhLIGHT = 2;
const MINLETTERSFORCOMPARISONIFNOTHESAME = 3;

const highlightSearchingElement = (el: string, text: string): string => {
  if (el.length > MINELEMENTLENGTHTOHIGhLIGHT) {
    if (
      text.toUpperCase().includes(el.toUpperCase()) ||
      el.toUpperCase().includes(text.toUpperCase()) ||
      el
        .toUpperCase()
        .slice(0, MINLETTERSFORCOMPARISONIFNOTHESAME)
        .includes(text.toUpperCase().slice(0, MINLETTERSFORCOMPARISONIFNOTHESAME))
    ) {
      return `<green>${el}</green>`;
    }
  }
  return el;
};

export default highlightSearchingElement;

/* if (el.toUpperCase().slice(0, -1) === text.toUpperCase() && el.endsWith('.')) {
  return `<green>${el.slice(0, -1)}</green>.`;
}
if (el.toUpperCase().slice(0, -1) === text.toUpperCase() && el.endsWith(',')) {
  return `<green>${el.slice(0, -1)}</green>,`;
}
if (el.toUpperCase().slice(0, -1) === text.toUpperCase() && el.endsWith('?')) {
  return `<green>${el.slice(0, -1)}</green>?`;
}
if (el.toUpperCase().slice(0, -1) === text.toUpperCase() && el.endsWith('!')) {
  return `<green>${el.slice(0, -1)}</green>!`;
}
if (el.toUpperCase().slice(0, -2) === text.toUpperCase() && el.endsWith('!)')) {
  return `<green>${el.slice(0, -2)}</green>!)`;
}
if (el.toUpperCase().slice(0, -2) === text.toUpperCase() && el.endsWith('?)')) {
  return `<green>${el.slice(0, -2)}</green>?)`;
}
if (el.toUpperCase().slice(1) === text.toUpperCase() && el.startsWith('(')) {
  return `(<green>${el.slice(1)}</green>`;
}
if (el.toUpperCase().slice(1).slice(-1) === text.toUpperCase() && el.startsWith(')') && el.endsWith(')')) {
  return `(<green>${el.slice(1).slice(-1)}</green>)`;
}
if (el.toUpperCase().slice(1).slice(-1) === text.toUpperCase() && el.startsWith('"') && el.endsWith('"')) {
  return `"<green>${el.slice(1).slice(-1)}</green>"`;
}
if (el.toUpperCase().slice(1).slice(-2) === text.toUpperCase() && el.startsWith('"') && el.endsWith('!"')) {
  return `"<green>${el.slice(1).slice(-2)}</green>!"`;
} */
