# Content Management & Curation

Purpose & Summary
Allow admins and content managers to create, tag, and organize educational content (articles, videos, PDFs) with metadata and versioning.

API Endpoints
- `POST /api/v1/content` — create content
  - Request: { "title":"string","type":"article|video|pdf","body":"string","tags":["braces","aftercare"] }
- `GET /api/v1/content/{id}` — fetch content

DB / Data Fields
- Content (id, title, type, body, tags, authorId, version, publishedAt, status)

Sample Payloads
- Create request example above

UI Notes
- CMS-like editor with WYSIWYG, media uploads, tagging and publish workflow

Acceptance Criteria
- Content can be versioned and published/unpublished
- Tagging used for personalization and search

Integration Hooks
- Campaigns to schedule content delivery
- Portal to display personalized content
