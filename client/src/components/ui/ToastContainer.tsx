import { Toast, type ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemoveToast }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};