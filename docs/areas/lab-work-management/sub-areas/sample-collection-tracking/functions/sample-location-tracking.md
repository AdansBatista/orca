# sample-location-tracking

**Quick Info**

| Attribute | Value |
|---|---|
| Status | 📋 Planned |
| Priority | High |

## Purpose

Track specimen physical location and status across facilities, couriers and storage units (fridges, freezers, shelves) with history and query capabilities.

## Summary

Maintain current location pointer and location history for specimens. Support location types (room, fridge:zone, courier-tracking-id) and alerting for misplacements or TTL expiration.

## API

- GET `/api/lab/specimens/{specimenId}/location` — returns current location and history.
- PATCH `/api/lab/specimens/{specimenId}/location`
	- Request: `{ "location": { "type":"fridge|courier|lab|archive", "id":"string", "meta": {} }, "actorId":"user_x", "timestamp":"iso" }`

## DB / Data Fields

- SpecimenLocation: `id`, `specimenId`, `locationType`, `locationId`, `metadata` (JSON), `actorId`, `timestamp`.

## Sample Payload

PATCH example:

{
	"location": { "type": "courier", "id": "trk_12345", "meta": { "carrier": "FastShip", "eta": "2025-11-28T10:00:00Z" } },
	"actorId": "user_90",
	"timestamp": "2025-11-27T15:30:00Z"
}

## UI Notes

- Specimen detail page shows map of location history and current ETA if in transit. Integrate with courier APIs to show live updates where available.

## Acceptance Criteria

- Location updates create historical entries and current location is queryable; alerts generated for out-of-policy storage conditions.
