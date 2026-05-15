import notifee from '@notifee/react-native';

// Notifee invokes this task on its own thread while the foreground service is
// running. Returning a never-resolving Promise keeps the service alive until
// `notifee.stopForegroundService()` is called.
//
// Wrap registration so a missing native module (e.g. on a build where notifee
// failed to link) can't hang the app at boot.
try {
  notifee.registerForegroundService(() => new Promise(() => {}));
} catch (e) {
  console.warn('[Notifee] registerForegroundService failed:', e);
}

export const MEETING_NOTIF_CHANNEL_ID = 'meeting-call';
export const MEETING_NOTIF_ID = 'meeting-call-notif';
export const ALERTS_CHANNEL_ID = 'alerts';

export async function ensureMeetingChannel() {
  await notifee.createChannel({
    id: MEETING_NOTIF_CHANNEL_ID,
    name: 'Active call',
    description: 'Persistent notification while a video meeting is in progress',
    importance: 4,
  });
}

export async function ensureAlertsChannel() {
  await notifee.createChannel({
    id: ALERTS_CHANNEL_ID,
    name: 'Alerts & updates',
    description: 'Booking, message, and session activity notifications',
    importance: 4,
    sound: 'default',
  });
}

/**
 * Display a one-shot OS notification (booking, chat, session updates). Safe to
 * call from anywhere — silently no-ops if notifee isn't available.
 */
export async function showAlertNotification(title: string, body: string, dataTag?: string) {
  try {
    await ensureAlertsChannel();
    await notifee.requestPermission();
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: ALERTS_CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#1A6BCC',
        pressAction: { id: 'default', launchActivity: 'default' },
        tag: dataTag,
      },
    });
  } catch (e) {
    console.warn('[Notifee] showAlertNotification failed:', e);
  }
}

export async function startMeetingForegroundService(roomLabel: string) {
  try {
    await ensureMeetingChannel();
    await notifee.requestPermission();
    await notifee.displayNotification({
      id: MEETING_NOTIF_ID,
      title: 'TagakTuro call in progress',
      body: roomLabel ? `In meeting · ${roomLabel}` : 'Tap to return to your call',
      android: {
        channelId: MEETING_NOTIF_CHANNEL_ID,
        asForegroundService: true,
        ongoing: true,
        pressAction: { id: 'default', launchActivity: 'default' },
        smallIcon: 'ic_launcher',
        color: '#1A6BCC',
      },
    });
  } catch (e) {
    console.warn('[Notifee] startMeetingForegroundService failed:', e);
  }
}

export async function stopMeetingForegroundService() {
  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification(MEETING_NOTIF_ID);
  } catch (e) {
    console.warn('[Notifee] stopMeetingForegroundService failed:', e);
  }
}
