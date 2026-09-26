package com.crosspay.recipient.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RecipientResponse(
        UUID recipientUserId,
        String name,
        String email,
        String country,
        OffsetDateTime createdAt
) { }
