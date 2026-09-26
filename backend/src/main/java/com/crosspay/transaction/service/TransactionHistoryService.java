package com.crosspay.transaction.service;

import com.crosspay.transaction.dto.TransactionHistoryResponse;
import com.crosspay.transaction.dto.TransactionResponse;
import com.crosspay.transaction.entity.Transaction;
import com.crosspay.transaction.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import com.crosspay.fx.entity.FxQuote;
import com.crosspay.fx.repository.FxQuoteRepository;

@Service
public class TransactionHistoryService {

    private static final int MAX_PAGE_SIZE = 100;

    private final TransactionRepository transactionRepository;
    private final FxQuoteRepository fxQuoteRepository;

    public TransactionHistoryService(TransactionRepository transactionRepository, FxQuoteRepository fxQuoteRepository) {
        this.transactionRepository = transactionRepository;
        this.fxQuoteRepository = fxQuoteRepository;
    }

    /** Backward-compatible constructor for existing unit tests and integrations. */
    public TransactionHistoryService(TransactionRepository transactionRepository) {
        this(transactionRepository, null);
    }

    /** Returns the unfiltered default page. */
    public TransactionHistoryResponse getTransactionHistory(UUID userId, int page, int size) {
        return getTransactionHistory(userId, page, size, null, null, null);
    }

    @Transactional(readOnly = true)
    public TransactionHistoryResponse getTransactionHistory(
            UUID userId,
            int page,
            int size,
            String status,
            LocalDate from,
            LocalDate to
    ) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (page < 0) {
            throw new IllegalArgumentException("Page must not be negative");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and " + MAX_PAGE_SIZE
            );
        }

        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        OffsetDateTime fromDate = from == null ? null : from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime toDate = to == null ? null : to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        Page<Transaction> transactions = status == null && fromDate == null && toDate == null
                ? transactionRepository.findTransactionHistoryByUserId(userId, pageable)
                : transactionRepository.findFilteredHistory(userId, status, fromDate, toDate, pageable);

        return new TransactionHistoryResponse(
                transactions.getContent().stream()
                        .map(this::toResponse)
                        .toList(),
                transactions.getNumber(),
                transactions.getSize(),
                transactions.getTotalElements(),
                transactions.getTotalPages()
        );
    }

    private TransactionResponse toResponse(Transaction transaction) {
        FxQuote quote = fxQuoteRepository == null || transaction.getFxQuoteId() == null || transaction.getInitiatedByUserId() == null
                ? null
                : fxQuoteRepository.findByIdAndUserId(transaction.getFxQuoteId(), transaction.getInitiatedByUserId()).orElse(null);
        return new TransactionResponse(
                transaction.getId(),
                transaction.getSenderUserId(),
                transaction.getRecipientUserId(),
                transaction.getTransactionType(),
                transaction.getStatus(),
                transaction.getCurrency(),
                transaction.getAmount(),
                transaction.getSourceCurrency(),
                transaction.getDestinationCurrency(),
                transaction.getSourceAmount(),
                transaction.getDestinationAmount(),
                transaction.getFxQuoteId(),
                quote == null ? null : quote.getExchangeRate(),
                quote == null ? null : quote.getFeeAmount(),
                transaction.getCreatedAt(),
                transaction.getCompletedAt()
        );
    }
}
