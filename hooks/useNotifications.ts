import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Notification handler setup not available on this platform');
}

export function useNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification response:', response);
      });

      return () => subscription.remove();
    } catch (error) {
      console.log('Notification listeners not available on this platform');
    }
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      if (typeof Notifications.requestPermissionsAsync !== 'function') {
        console.log('Notification permissions not available on this platform');
        return false;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.log('Notification permissions not available:', error);
      return false;
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    hour: number,
    minute: number = 0
  ) => {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  return {
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
  };
}
