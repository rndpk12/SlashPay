package com.crosspay.transfer.provider;

import com.crosspay.transaction.entity.Transaction;

/**
 * Boundary for a money-movement rail.
 *
 * The internal ledger is the current implementation. A regulated external
 * rail can implement this contract later without leaking provider details into
 * the dashboard or transaction model.
 */
public interface TransferProvider {

    String providerId();

    /**
     * Submit a previously validated transfer to this rail.
     * Implementations must be idempotent for the transaction's idempotency key.
     */
    ProviderSubmission submit(Transaction transaction);

    record ProviderSubmission(
            String providerTransferId,
            String status,
            String failureReason
    ) {
    }
}
