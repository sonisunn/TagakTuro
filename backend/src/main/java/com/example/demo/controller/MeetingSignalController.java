package com.example.demo.controller;

import com.example.demo.model.SignalMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Relays WebRTC signaling messages (JOIN, OFFER, ANSWER, ICE_CANDIDATE, LEAVE, MEDIA_STATE)
 * between participants in a meeting room identified by bookingId.
 *
 * Client sends to:   /app/meeting/{roomId}/signal
 * Client subscribes: /topic/meeting/{roomId}
 */
@Controller
public class MeetingSignalController {

    @MessageMapping("/meeting/{roomId}/signal")
    @SendTo("/topic/meeting/{roomId}")
    public SignalMessage relay(
            @DestinationVariable String roomId,
            @Payload SignalMessage message) {
        return message;
    }
}
