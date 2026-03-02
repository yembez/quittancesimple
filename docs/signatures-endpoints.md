# Signatures API

## POST `/functions/v1/signatures-create`

### Body
```json
{
  "bail_id": "uuid",
  "document_url": "https://...",
  "owner_name": "Nom Bailleur",
  "owner_consent": true,
  "consent_version": "v1_2026",
  "signers": [
    {
      "name": "Locataire 1",
      "email": "locataire@example.com",
      "phone": "+33600000000",
      "role": "locataire"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "request": { "...": "..." },
  "token": "hex_64_bytes"
}
```

---

## GET `/functions/v1/signatures-get?token=...`

### Response
```json
{
  "id": "uuid",
  "bail_id": "uuid",
  "document_url": "https://...",
  "document_hash": "sha256",
  "status": "pending",
  "signers": [
    {
      "id": "uuid",
      "name": "Locataire 1",
      "email": "locataire@example.com",
      "phone": "+33600000000",
      "role": "locataire",
      "status": "pending",
      "otp_expires_at": null,
      "otp_attempts": 0,
      "signed_at": null,
      "ip": null,
      "user_agent": null
    }
  ],
  "owner_signature": { "...": "..." },
  "created_at": "timestamp",
  "completed_at": null,
  "token_expires_at": "timestamp"
}
```

---

## POST `/functions/v1/signatures-send-otp`

### Body
```json
{
  "token": "token_hex",
  "signer_id": "uuid"
}
```

### Response
```json
{
  "success": true,
  "otp_expires_at": "timestamp"
}
```

---

## POST `/functions/v1/signatures-sign`

### Body
```json
{
  "token": "token_hex",
  "signer_id": "uuid",
  "otp": "123456",
  "consent": true
}
```

### Response
```json
{
  "success": true,
  "all_signed": true,
  "finalization": {
    "success": true
  }
}
```

---

## POST `/functions/v1/signatures-generate-final-pdf`

### Body
```json
{
  "token": "token_hex"
}
```

### Response
```json
{
  "success": true,
  "request_id": "uuid",
  "bail_id": "uuid",
  "status": "signed",
  "final_document_url": "https://...",
  "storage_path": "signatures/.../signed.pdf"
}
```
