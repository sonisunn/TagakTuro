package com.example.demo.model;

public class SignalMessage {
    private String type;        // JOIN, OFFER, ANSWER, ICE_CANDIDATE, LEAVE, MEDIA_STATE, CHAT
    private String senderId;
    private String senderName;
    private String targetId;    // null = broadcast; set for OFFER, ANSWER, ICE_CANDIDATE
    private String sdp;         // OFFER / ANSWER
    private String candidate;   // ICE_CANDIDATE — the candidate string
    private Integer label;      // ICE_CANDIDATE — sdpMLineIndex
    private String id;          // ICE_CANDIDATE — sdpMid
    private Boolean isMicOn;    // MEDIA_STATE
    private Boolean isCameraOn; // MEDIA_STATE
    private String text;        // CHAT — message body

    public SignalMessage() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getSdp() { return sdp; }
    public void setSdp(String sdp) { this.sdp = sdp; }

    public String getCandidate() { return candidate; }
    public void setCandidate(String candidate) { this.candidate = candidate; }

    public Integer getLabel() { return label; }
    public void setLabel(Integer label) { this.label = label; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Boolean getIsMicOn() { return isMicOn; }
    public void setIsMicOn(Boolean isMicOn) { this.isMicOn = isMicOn; }

    public Boolean getIsCameraOn() { return isCameraOn; }
    public void setIsCameraOn(Boolean isCameraOn) { this.isCameraOn = isCameraOn; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
