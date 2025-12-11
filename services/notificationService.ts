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
    // Cancel all existing task notifications
    await cancelAllTaskNotifications();

    const scheduledNotifications: TaskNotification[] = [];

    // Schedule notification for each incomplete task
    for (const task of tasks) {
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
    }

    // Store notification IDs for later reference
    if (scheduledNotifications.length > 0) {
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(scheduledNotifications)
      );
    }

    return scheduledNotifications;
  } catch (error) {
    console.error('Error scheduling task notifications:', error);
    return [];
  }
}

export async function cancelAllTaskNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      const notifications: TaskNotification[] = JSON.parse(stored);
      for (const notification of notifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
      }
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }

    // Also cancel any remaining scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling task notifications:', error);
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
