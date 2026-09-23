import { toast, type ExternalToast } from 'sonner';

type NotifyOptions = ExternalToast;

const baseOptions: NotifyOptions = {
  closeButton: true,
};

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return toast.success(message, {
      ...baseOptions,
      duration: 4000,
      ...options,
    });
  },

  error(message: string, options?: NotifyOptions) {
    return toast.error(message, {
      ...baseOptions,
      duration: 6000,
      ...options,
    });
  },

  warning(message: string, options?: NotifyOptions) {
    return toast.warning(message, {
      ...baseOptions,
      duration: 5000,
      ...options,
    });
  },

  info(message: string, options?: NotifyOptions) {
    return toast.info(message, {
      ...baseOptions,
      duration: 4000,
      ...options,
    });
  },

  loading(message: string, options?: NotifyOptions) {
    return toast.loading(message, {
      ...baseOptions,
      ...options,
    });
  },

  dismiss(id?: string | number) {
    toast.dismiss(id);
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: NotifyOptions
  ) {
    return toast.promise(promise, {
      ...messages,
      ...baseOptions,
      ...options,
    });
  },
};

/** @deprecated Use `notify` for consistent toast behavior */
export { toast };
