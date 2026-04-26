package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@SuppressWarnings("all")
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketChannelInterceptor webSocketChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker
        // Messages starting with /topic are for broadcasting
        // Messages starting with /queue are for private messages
        config.enableSimpleBroker("/topic", "/queue");

        // Define the prefix for messages sent from client to server
        config.setApplicationDestinationPrefixes("/app");

        // Define the prefix for user-specific message destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the WebSocket endpoint
        // Client will connect to ws://localhost:8080/ws
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*") // Allow all origins (configure as needed)
                .withSockJS(); // Enable SockJS fallback for older browsers
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add JWT interceptor to validate tokens on connection
        registration.interceptors(webSocketChannelInterceptor);
    }
}
