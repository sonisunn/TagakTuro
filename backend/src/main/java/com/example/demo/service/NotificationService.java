package com.example.demo.service;

import com.example.demo.controller.NotificationWebSocketBroadcaster;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationWebSocketBroadcaster notificationWebSocketBroadcaster;

    public Notification createNotification(Long userId, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Notification notification = new Notification(user, title, body);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast in real-time to the user
        notificationWebSocketBroadcaster.broadcastNotificationToUser(userId, saved);
        // Update unread count
        Long unreadCount = countUnreadNotifications(userId);
        notificationWebSocketBroadcaster.broadcastUnreadCountUpdate(userId, unreadCount);
        
        return saved;
    }
    
    public Notification createNotification(User user, String title, String body) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        Notification notification = new Notification(user, title, body);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast in real-time to the user
        notificationWebSocketBroadcaster.broadcastNotificationToUser(user.getId(), saved);
        // Update unread count
        Long unreadCount = countUnreadNotifications(user.getId());
        notificationWebSocketBroadcaster.broadcastUnreadCountUpdate(user.getId(), unreadCount);
        
        return saved;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByDateSentDesc(userId);
    }
    
        // Broadcast updated count
        notificationWebSocketBroadcaster.broadcastUnreadCountUpdate(userId, 0L);
    }

    /**
     * Count unread notifications for a user
     */
    public Long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByDateSentDesc(userId);
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }
}
