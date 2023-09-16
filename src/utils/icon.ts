import { ICON_CLASS } from '../config';

const icon = (id: string, text: string): string => `<span class="${ICON_CLASS}">${id}</span> ${text}`;

export default icon;
