# lis-api-connector

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Provide connector templates and operational patterns to integrate with vendor LIS systems via REST APIs, webhooks, or file drops (SFTP). Handle auth, rate-limiting, paging, retries, and error handling.

## Summary

Connectors encapsulate vendor-specific behavior: authentication (OAuth2 / API key), polling vs push, message formats (HL7 vs FHIR vs custom JSON), and attachment retrieval. Implement connector adapter interface to support new vendors with minimal code.

## Connector Types

- REST API (OAuth2 or API Key)
- Webhook (push) with JWT or HMAC verification
- SFTP file drops (HL7 or PDF batches)

## API / Connector Contract

Implement adapter with methods:

- `fetchMessages(sinceTimestamp)` — returns list of message metadata
- `getMessagePayload(messageId)` — returns raw payload and attachments
- `ackMessage(messageId)` — mark as processed

## Operational Concerns

- Rate limiting and backoff; honor vendor quotas.
- Idempotency and deduplication using vendor message ids.
- Secure storage of credentials and rotation procedures.

## Sample Connector Config

{
	"vendor": "FastLab",
	"type": "rest",
	"auth": { "type":"oauth2", "clientId":"...", "tokenUrl":"https://.../token" },
	"pollIntervalMinutes": 1
}

## Acceptance Criteria

- Provide example connectors for at least one REST (FHIR) vendor, one HL7/MLLP vendor, and SFTP batch ingest.
- Connectors support retry logic and DLQ on repeated failures.
