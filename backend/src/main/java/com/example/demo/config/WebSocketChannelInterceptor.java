package com.example.demo.config;

import com.example.demo.security.JwtUtil;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Intercepts WebSocket connection handshakes to extract and validate JWT tokens.
 * Maps the authenticated user email to a principal so it's available in controllers.
 */
@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    /**
     * Called before a message is sent to the channel.
     * Extracts JWT from headers and validates it.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.getMessageHeaders(message);

        // Get JWT token from headers
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String email = jwtUtil.validateAndGetSubject(token);
                
                if (email != null) {
                    // Find user by email to get their ID
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        // Set the principal name to userId (can be retrieved in controllers)
                        accessor.setUser(new UserPrincipal(user.getId().toString(), email));
                    } else {
                        // User not found
                        throw new RuntimeException("User not found for email: " + email);
                    }
                } else {
                    // Invalid token
                    throw new RuntimeException("Invalid JWT token");
                }
            }
        }

        return message;
    }

    /**
     * Custom Principal implementation to hold both userId and email
     */
    public static class UserPrincipal implements java.security.Principal {
        private final String userId;
        private final String email;

        public UserPrincipal(String userId, String email) {
            this.userId = userId;
            this.email = email;
        }

        @Override
        public String getName() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public String getUserId() {
            return userId;
        }
    }
}
