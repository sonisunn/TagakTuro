package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Notification createNotification(Long userId, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Notification notification = new Notification(user, title, body);
        Notification saved = notificationRepository.save(notification);

        // Push real-time notification via WebSocket
        pushNotificationToUser(userId, saved);

        return saved;
    }
    
    public Notification createNotification(User user, String title, String body) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        Notification notification = new Notification(user, title, body);
        Notification saved = notificationRepository.save(notification);

        // Push real-time notification via WebSocket
        pushNotificationToUser(user.getId(), saved);

        return saved;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByDateSentDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);

        // Push updated unread count
        Long userId = notification.retrieveUserId();
        if (userId != null) {
            pushUnreadCount(userId);
        }

        return saved;
    }

    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByDateSentDesc(userId);
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);

        // Push updated unread count (now 0)
        pushUnreadCount(userId);
    }

    /**
     * Push a new notification + updated unread count to the user via WebSocket
     */
    private void pushNotificationToUser(Long userId, Notification notification) {
        try {
            // Build a simple DTO map (avoids lazy-loading issues with User entity)
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", notification.getId());
            payload.put("userId", userId);
            payload.put("title", notification.getTitle());
            payload.put("body", notification.getBody());
            payload.put("read", notification.isRead());
            payload.put("dateSent", notification.getDateSent().toString());

            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + userId, payload);

            // Also push updated unread count
            pushUnreadCount(userId);
        } catch (Exception e) {
            // Don't let WebSocket errors break notification creation
            System.err.println("Failed to push notification via WebSocket: " + e.getMessage());
        }
    }

    /**
     * Push the current unread count to the user
     */
    private void pushUnreadCount(Long userId) {
        try {
            long count = notificationRepository.countByUserIdAndIsRead(userId, false);
            Map<String, Object> countPayload = new HashMap<>();
            countPayload.put("unreadCount", count);

            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + userId + "/count", countPayload);
        } catch (Exception e) {
            System.err.println("Failed to push unread count via WebSocket: " + e.getMessage());
        }
    }
}
