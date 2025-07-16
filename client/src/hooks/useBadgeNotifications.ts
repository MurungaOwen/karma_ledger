import { useEffect, useRef } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const useBadgeNotifications = () => {
  const { showBadgeToast } = useToast();
  const lastBadgeCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  const checkForNewBadges = async () => {
    try {
      const badges = await apiClient.getMyBadges();
      const currentBadgeCount = badges.length;
      
      if (isInitialLoadRef.current) {
        // On initial load, just set the count without showing notifications
        lastBadgeCountRef.current = currentBadgeCount;
        isInitialLoadRef.current = false;
        return;
      }

      if (currentBadgeCount > lastBadgeCountRef.current) {
        // New badges detected - show notifications for the newest ones
        const newBadges = badges
          .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
          .slice(0, currentBadgeCount - lastBadgeCountRef.current);

        for (const userBadge of newBadges) {
          if (userBadge.badge) {
            const badge = userBadge.badge;
            const rarity = getBadgeRarity(badge.code);
            
            showBadgeToast({
              icon: getBadgeIcon(badge.icon),
              name: badge.name,
              description: badge.description,
              rarity
            });
          }
        }

        lastBadgeCountRef.current = currentBadgeCount;
      }
    } catch (error) {
      console.error('Error checking for new badges:', error);
    }
  };

  const getBadgeIcon = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      'first-event': '🎯',
      'milestone-10': '🏆',
      'milestone-50': '🌟',
      'milestone-100': '💎',
      'top-10': '👑',
      'default': '🏅'
    };
    return iconMap[icon] || iconMap.default;
  };

  const getBadgeRarity = (code: string): 'common' | 'rare' | 'epic' | 'legendary' => {
    if (code.includes('100')) return 'legendary';
    if (code.includes('50')) return 'epic';
    if (code.includes('10') || code.includes('top')) return 'rare';
    return 'common';
  };

  const triggerBadgeCheck = () => {
    // Allow manual triggering of badge check (useful after creating events)
    setTimeout(() => {
      checkForNewBadges();
    }, 3000); // Small delay to allow backend processing
    
    // Also check again after a longer delay in case the first check was too early
    setTimeout(() => {
      checkForNewBadges();
    }, 10000);
  };

  useEffect(() => {
    // Initial check
    checkForNewBadges();

    // Set up polling for badge updates (every 30 seconds)
    const interval = setInterval(checkForNewBadges, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    checkForNewBadges,
    triggerBadgeCheck
  };
};