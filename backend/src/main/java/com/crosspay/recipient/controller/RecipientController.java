package com.crosspay.recipient.controller;

import com.crosspay.recipient.dto.CreateRecipientRequest;
import com.crosspay.recipient.dto.RecipientResponse;
import com.crosspay.recipient.service.RecipientService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recipients")
@Tag(name = "Recipients", description = "Saved internal recipients for the signed-in user")
public class RecipientController {
    private final RecipientService recipientService;

    public RecipientController(RecipientService recipientService) { this.recipientService = recipientService; }

    @GetMapping
    public ResponseEntity<List<RecipientResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(recipientService.list((UUID) authentication.getPrincipal()));
    }

    @PostMapping
    public ResponseEntity<RecipientResponse> add(Authentication authentication, @Valid @RequestBody CreateRecipientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recipientService.add((UUID) authentication.getPrincipal(), request.email()));
    }

    @DeleteMapping("/{recipientUserId}")
    public ResponseEntity<Void> remove(Authentication authentication, @PathVariable UUID recipientUserId) {
        recipientService.remove((UUID) authentication.getPrincipal(), recipientUserId);
        return ResponseEntity.noContent().build();
    }
}
