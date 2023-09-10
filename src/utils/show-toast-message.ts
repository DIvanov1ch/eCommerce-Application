import Toastify, { Options } from 'toastify-js';
import 'toastify-js/src/toastify.css';

const ToastBackground = {
  GREEN: 'linear-gradient(to right, #00b09b, #96c93d)',
  RED: 'linear-gradient(to right, #e91e63, #f44336)',
};

const getToastOptions = (message: string, background: string): Options => {
  return {
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: 'top',
    position: 'center',
    stopOnFocus: true,
    style: {
      background,
    },
    offset: {
      x: 0,
      y: '35px',
    },
  };
};

function showToastMessage(message: string, isResultOk: boolean): void {
  const props: Options = isResultOk
    ? getToastOptions(message, ToastBackground.GREEN)
    : getToastOptions(message, ToastBackground.RED);
  Toastify(props).showToast();
}

export default showToastMessage;
