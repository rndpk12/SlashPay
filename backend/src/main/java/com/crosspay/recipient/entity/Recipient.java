package com.crosspay.recipient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "recipients")
public class Recipient {

    @Id
    private UUID id;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Recipient() { }

    public UUID getId() { return id; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public UUID getRecipientUserId() { return recipientUserId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setId(UUID id) { this.id = id; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }
    public void setRecipientUserId(UUID recipientUserId) { this.recipientUserId = recipientUserId; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
