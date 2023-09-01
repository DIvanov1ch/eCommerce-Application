export type ToastProps = {
  text: string;
  duration?: number;
  destination?: string;
  newWindow?: boolean;
  close?: boolean;
  gravity: string;
  position: string;
  stopOnFocus: boolean;
  style: {
    background: string;
  };
  offset?: {
    x?: string;
    y?: string;
  };
};
