package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
@SuppressWarnings("all")
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // STOMP heartbeats every 10s in both directions. Without these the
        // TCP connection idles out at mobile-carrier NATs (~60s), silently
        // killing in-call chat even while peer-to-peer video is still flowing.
        //
        // The scheduler is created inline (not a @Bean) so Spring's container
        // never sees a circular dependency between this @Configuration class
        // and the scheduler it owns.
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("stomp-heartbeat-");
        scheduler.initialize();

        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[] { 10000, 10000 })
                .setTaskScheduler(scheduler);

        // Define the prefix for messages sent from client to server
        config.setApplicationDestinationPrefixes("/app");

        // Define the prefix for user-specific message destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Native WebSocket endpoint for React Native/Mobile clients
        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Bumped from the 64KB default so larger SDP offers / signaling frames
        // don't get silently dropped by the broker.
        registration.setMessageSizeLimit(512 * 1024);
        registration.setSendBufferSizeLimit(1024 * 1024);
        registration.setSendTimeLimit(20_000);
    }
}
