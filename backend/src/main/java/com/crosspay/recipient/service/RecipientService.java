package com.crosspay.recipient.service;

import com.crosspay.recipient.dto.RecipientResponse;
import com.crosspay.recipient.entity.Recipient;
import com.crosspay.recipient.repository.RecipientRepository;
import com.crosspay.user.entity.User;
import com.crosspay.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RecipientService {
    private final RecipientRepository recipientRepository;
    private final UserRepository userRepository;

    public RecipientService(RecipientRepository recipientRepository, UserRepository userRepository) {
        this.recipientRepository = recipientRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipientResponse> list(UUID ownerUserId) {
        return recipientRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RecipientResponse add(UUID ownerUserId, String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("No active Cross Pay user exists for that email"));
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("Recipient account is not active");
        }
        if (ownerUserId.equals(user.getId())) {
            throw new IllegalArgumentException("You cannot add your own account as a recipient");
        }
        Recipient recipient = recipientRepository.findByOwnerUserIdAndRecipientUserId(ownerUserId, user.getId())
                .orElseGet(() -> {
                    Recipient created = new Recipient();
                    created.setId(UUID.randomUUID());
                    created.setOwnerUserId(ownerUserId);
                    created.setRecipientUserId(user.getId());
                    created.setCreatedAt(OffsetDateTime.now());
                    return recipientRepository.save(created);
                });
        return toResponse(recipient);
    }

    @Transactional
    public void remove(UUID ownerUserId, UUID recipientUserId) {
        recipientRepository.deleteByOwnerUserIdAndRecipientUserId(ownerUserId, recipientUserId);
    }

    private RecipientResponse toResponse(Recipient recipient) {
        User user = userRepository.findById(recipient.getRecipientUserId())
                .orElseThrow(() -> new IllegalStateException("Recipient user no longer exists"));
        String name = (user.getFirstName() + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return new RecipientResponse(user.getId(), name, user.getEmail(), user.getCountry(), recipient.getCreatedAt());
    }
}
