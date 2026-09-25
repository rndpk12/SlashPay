ALTER TABLE transactions
    ADD COLUMN provider VARCHAR(30) NOT NULL DEFAULT 'INTERNAL_LEDGER',
    ADD COLUMN provider_transfer_id VARCHAR(120),
    ADD COLUMN failure_reason VARCHAR(255);

CREATE INDEX idx_transactions_provider_transfer
    ON transactions(provider, provider_transfer_id)
    WHERE provider_transfer_id IS NOT NULL;
