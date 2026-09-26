CREATE TABLE recipients (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    recipient_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT uq_recipient_owner_contact UNIQUE (owner_user_id, recipient_user_id),
    CONSTRAINT chk_recipient_not_self CHECK (owner_user_id <> recipient_user_id)
);

CREATE INDEX idx_recipients_owner_created_at
    ON recipients(owner_user_id, created_at DESC);
