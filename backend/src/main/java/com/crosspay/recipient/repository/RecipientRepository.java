package com.crosspay.recipient.repository;

import com.crosspay.recipient.entity.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipientRepository extends JpaRepository<Recipient, UUID> {
    List<Recipient> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);
    Optional<Recipient> findByOwnerUserIdAndRecipientUserId(UUID ownerUserId, UUID recipientUserId);
    void deleteByOwnerUserIdAndRecipientUserId(UUID ownerUserId, UUID recipientUserId);
}
