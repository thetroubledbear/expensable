import { Alert } from 'react-native';

export const notifyError = (error: unknown, fallback: string = 'An unexpected error occurred') => {
  let message = fallback;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  Alert.alert('Error', message);
};
