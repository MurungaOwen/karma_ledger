import { createContext, useContext, useState, type ReactNode } from 'react';
import { ToastContainer } from '../components/ui/ToastContainer';
import type{ ToastProps } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  showBadgeToast: (badge: {
    icon: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showBadgeToast = (badge: {
    icon: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => {
    const getRarityEmoji = (rarity: string) => {
      switch (rarity) {
        case 'legendary': return '✨';
        case 'epic': return '🌟';
        case 'rare': return '💫';
        default: return '🎉';
      }
    };

    showToast({
      type: 'badge',
      title: `${getRarityEmoji(badge.rarity)} Badge Earned!`,
      message: `You've unlocked the "${badge.name}" badge!`,
      duration: 8000, // Longer duration for badge notifications
      badge: {
        icon: badge.icon,
        name: badge.name,
        rarity: badge.rarity
      }
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showBadgeToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};