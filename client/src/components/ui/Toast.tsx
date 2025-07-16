import { useState, useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'badge';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  badge?: {
    icon: string;
    name: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export const Toast = ({ id, type, title, message, duration = 5000, onClose, badge }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out pointer-events-auto";
    
    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100 scale-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0 scale-95`;
  };

  // Special styling for badge notifications
  if (type === 'badge') {
    const rarityStyles = {
      common: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
        accent: 'bg-green-500',
        glow: 'shadow-green-200'
      },
      rare: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        accent: 'bg-blue-500',
        glow: 'shadow-blue-200'
      },
      epic: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        accent: 'bg-purple-500',
        glow: 'shadow-purple-200'
      },
      legendary: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        accent: 'bg-yellow-500',
        glow: 'shadow-yellow-200'
      }
    };

    const rarity = badge?.rarity || 'common';
    const styles = rarityStyles[rarity];

    return (
      <div className={`${getToastStyles()} w-full max-w-sm`}>
        <div className={`${styles.bg} border-2 ${styles.border} rounded-xl shadow-xl ${styles.glow} overflow-hidden backdrop-blur-sm`}>
          {/* Top accent bar */}
          <div className={`h-1.5 ${styles.accent} w-full`}></div>
          
          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* Badge icon with animation */}
              <div className="flex-shrink-0 relative">
                <div className="text-3xl animate-bounce">
                  {badge?.icon || '🏅'}
                </div>
                {/* Sparkle effect */}
                <div className="absolute -top-0.5 -right-0.5 text-xs animate-pulse">
                  ✨
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-base font-bold ${styles.text} leading-tight`}>
                    {title}
                  </h3>
                  <button
                    onClick={handleClose}
                    className={`${styles.text} hover:opacity-75 transition-opacity ml-2 flex-shrink-0`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className={`${styles.text} opacity-90 mb-3 text-sm leading-relaxed`}>
                  {message}
                </p>
                
                {badge && (
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${styles.accent} text-white`}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </div>
                    <div className={`text-xs font-medium ${styles.text} opacity-80 truncate`}>
                      "{badge.name}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular toast styling
  const getRegularToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: (
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: (
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const styles = getRegularToastStyles();

  return (
    <div className={`${getToastStyles()} w-full max-w-sm`}>
      <div className={`${styles.bg} border ${styles.border} rounded-lg shadow-lg`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${styles.text}`}>
                {title}
              </p>
              <p className={`mt-1 text-sm ${styles.text} opacity-90`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleClose}
                className={`${styles.text} hover:opacity-75 transition-opacity`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};