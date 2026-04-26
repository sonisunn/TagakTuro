package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Broadcasts notifications to connected clients in real-time.
 * Called by NotificationService when a notification is created.
 */
@Component
public class NotificationWebSocketBroadcaster {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a notification to a specific user in real-time.
     * Client subscribes to: /user/{userId}/queue/notifications
     * 
     * @param userId The target user ID
     * @param notification The notification to broadcast
     */
    public void broadcastNotificationToUser(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            System.err.println("Failed to broadcast notification to user " + userId + ": " + e.getMessage());
        }
    }

    /**
     * Broadcast a notification count update to a specific user.
     * 
     * @param userId The target user ID
     * @param unreadCount The number of unread notifications
     */
    public void broadcastUnreadCountUpdate(Long userId, Long unreadCount) {
        try {
            NotificationCountMessage countMsg = new NotificationCountMessage(unreadCount);
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notification-count",
                    countMsg
            );
        } catch (Exception e) {
            System.err.println("Failed to broadcast notification count to user " + userId + ": " + e.getMessage());
        }
    }

    /**
     * DTO for notification count updates
     */
    public static class NotificationCountMessage {
        private Long unreadCount;

        public NotificationCountMessage() {}

        public NotificationCountMessage(Long unreadCount) {
            this.unreadCount = unreadCount;
        }

        public Long getUnreadCount() {
            return unreadCount;
        }

        public void setUnreadCount(Long unreadCount) {
            this.unreadCount = unreadCount;
        }
    }
}
