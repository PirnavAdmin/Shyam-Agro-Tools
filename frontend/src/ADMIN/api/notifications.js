const BASE_URL = 'http://shyamagrotools.com/api/Notifications';

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// GET /api/Notifications - fetch all notifications
export const getNotifications = async () => {
  const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch notifications (${response.status})`);
  return response.json();
};

// GET /api/Notifications/unread-count - get unread count
export const getUnreadCount = async () => {
  const response = await fetch(`${BASE_URL}/unread-count`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch unread count (${response.status})`);
  const text = await response.text();
  return parseInt(text, 10) || 0;
};

// PUT /api/Notifications/{id}/read - mark a notification as read (returns 204 NoContent)
export const markAsRead = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}/read`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to mark notification ${id} as read (${response.status})`);
  return { success: true };
};

// PUT /api/Notifications/mark-all-read - mark all notifications as read (returns 204 NoContent)
export const markAllAsRead = async () => {
  const response = await fetch(`${BASE_URL}/mark-all-read`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to mark all notifications as read (${response.status})`);
  return { success: true };
};

// DELETE /api/Notifications/{id} - delete a specific notification (returns 204 NoContent)
export const deleteNotification = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to delete notification ${id} (${response.status})`);
  return { success: true };
};

// DELETE /api/Notifications/clear-all - clear all notifications (returns 204 NoContent)
export const clearAllNotifications = async () => {
  const response = await fetch(`${BASE_URL}/clear-all`, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to clear all notifications (${response.status})`);
  return { success: true };
};
