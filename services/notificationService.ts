import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_STORAGE_KEY = 'task_notifications';

interface TaskNotification {
  taskId: string;
  notificationId: string;
  taskTitle: string;
}

export async function scheduleTaskNotifications(
  tasks: Array<{ id: string; title: string }>,
  hour: number,
  minute: number = 0
) {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    if (typeof Notifications.scheduleNotificationAsync !== 'function') {
      console.log('Notification scheduling not available on this platform');
      return [];
    }

    // Cancel all existing task notifications
    await cancelAllTaskNotifications();

    const scheduledNotifications: TaskNotification[] = [];

    // Schedule notification for each incomplete task
    for (const task of tasks) {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Recordatorio de Tareas',
            body: `No olvides: ${task.title}`,
            sound: 'default',
            badge: tasks.length,
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          } as any,
        });

        scheduledNotifications.push({
          taskId: task.id,
          notificationId,
          taskTitle: task.title,
        });
      } catch (taskError) {
        console.log(`Could not schedule notification for task ${task.id}:`, taskError);
      }
    }

    // Store notification IDs for later reference
    if (scheduledNotifications.length > 0) {
      try {
        localStorage.setItem(
          NOTIFICATION_STORAGE_KEY,
          JSON.stringify(scheduledNotifications)
        );
      } catch (storageError) {
        console.log('Could not store notification IDs:', storageError);
      }
    }

    return scheduledNotifications;
  } catch (error) {
    console.log('Error scheduling task notifications:', error);
    return [];
  }
}

export async function cancelAllTaskNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const notifications: TaskNotification[] = JSON.parse(stored);
        for (const notification of notifications) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
          } catch (e) {
            console.log('Could not cancel notification:', e);
          }
        }
        localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      }
    } catch (storageError) {
      console.log('Could not access storage:', storageError);
    }

    // Also cancel any remaining scheduled notifications
    if (typeof Notifications.cancelAllScheduledNotificationsAsync === 'function') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {
        console.log('Could not cancel all notifications:', e);
      }
    }
  } catch (error) {
    console.log('Error canceling task notifications:', error);
  }
}

export function getSavedNotificationTime(): { hour: number; minute: number } {
  try {
    const stored = localStorage.getItem('notification_time');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting saved notification time:', error);
  }

  // Default to 9:00 AM
  return { hour: 9, minute: 0 };
}

export function saveNotificationTime(hour: number, minute: number) {
  try {
    localStorage.setItem('notification_time', JSON.stringify({ hour, minute }));
  } catch (error) {
    console.error('Error saving notification time:', error);
  }
}

export function getStoredTaskNotifications(): TaskNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting stored notifications:', error);
  }
  return [];
}
