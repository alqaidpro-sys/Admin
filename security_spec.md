# Security Specification & "Dirty Dozen" Threat Model

This document establishes the security invariants for the MiM Plus database and outlines the "Dirty Dozen" payloads used to test and audit our **Zero-Trust Attribute-Based Access Control (ABAC)** ruleset.

## 1. Security Architecture & Data Invariants

1. **Super Admin (Owner) Superiority**: Only the authenticated user `alQaidPro@gmail.com` (user ID or verified email) can access and write to all collections, including creating or deleting `supervisors` or overriding `settings`.
2. **Role-Based Isolation (Supervisors)**:
   - A supervisor has credentials registered under `supervisors` collection.
   - On signing in, if they have an assigned section (e.g., `series`, `channels`, `matches` or `banners`), they can only read and write documents inside that specific collection.
   - They are strictly blocked from writing to, modifying, or creating documents in any *other* collections.
   - They are strictly blocked from editing `/settings/appSettings`.
   - They cannot view, create, edit, or delete any other supervisor document.
3. **No Key Spoofing & Static Schema Enforcement**:
   - Updates must use `affectedKeys().hasOnly([...])` to prevent injects/shadow edits.
   - ID strings of all entities must match regular expressions `^[a-zA-Z0-9_\-]+$` and have size constraints under 128 chars.
4. **Time Verification**: All timestamp values (`createdAt`, `updatedAt`) must strictly match `request.time`.

---

## 2. The "Dirty Dozen" Malicious Payloads

Each test case simulates a malicious attempt to write to Firestore, verified to be rejected with a `PERMISSION_DENIED` status.

### Case 1: Supervisor Privilege Escalation (Modifying Roles)
- **Path**: `/supervisors/some_supervisor`
- **User Context**: Authenticated as `supervisor_sport@mimplus.com`
- **Attempt**: Change their assigned section to "all" or elevate permissions.
- **Payload**:
  ```json
  {
    "assignedSection": "settings"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (Only `alQaidPro@gmail.com` can write to `supervisors`).

### Case 2: Untrusted User Creating a Series
- **Path**: `/series/s99`
- **User Context**: Guest or unauthenticated user
- **Attempt**: Write a new movie catalog entry.
- **Payload**:
  ```json
  {
    "id": "s99",
    "title": "Hacked Series",
    "genre": "Action"
  }
  ```
- **Expectation**: `PERMISSION_DENIED`.

### Case 3: Out-of-Bounds Supervisor Writes (Sports Admin writing to Banners)
- **Path**: `/banners/b99`
- **User Context**: Authenticated as supervisor `sport_guy` (assigned section: `matches`)
- **Attempt**: Create or update a promotional banner.
- **Payload**:
  ```json
  {
    "id": "b99",
    "title": "Spam Banner",
    "type": "custom"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (`matches` supervisor can only write to `/matches/`).

### Case 4: Owner Identity Spoofing (Registering as owner)
- **Path**: `/supervisors/hijacked_owner`
- **User Context**: Authenticated as anonymous or guest user
- **Attempt**: Write a supervisor profile claiming the email `alQaidPro@gmail.com` to bypass backend gates.
- **Payload**:
  ```json
  {
    "id": "hijacked_owner",
    "name": "Intruder",
    "email": "alQaidPro@gmail.com",
    "assignedSection": "settings"
  }
  ```
- **Expectation**: `PERMISSION_DENIED`.

### Case 5: Out-of-Bounds Supervisor Writes (Series Admin editing Channel links)
- **Path**: `/channels/c1`
- **User Context**: Authenticated as series supervisor `drama_queen` (assigned section: `series`)
- **Attempt**: Hijack a live stream link.
- **Payload**:
  ```json
  {
    "streamUrl": "https://attacker.com/malicious_stream.m3u8"
  }
  ```
- **Expectation**: `PERMISSION_DENIED`.

### Case 6: Shadow-Field Injection on Series Collection
- **Path**: `/series/s1`
- **User Context**: Authenticated as series supervisor
- **Attempt**: Injecting a "premiumFreePass" or "isVerified" custom shadow parameter to compromise client parsing.
- **Payload**:
  ```json
  {
    "id": "s1",
    "title": "Modified Title",
    "isVipFree": true
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (fails `affectedKeys().hasOnly(...)` gate).

### Case 7: Arbitrary Global System Injection
- **Path**: `/settings/appSettings`
- **User Context**: Authenticated as standard series supervisor `drama_boss`
- **Attempt**: Change system maintenance flag or redirect legal parameters.
- **Payload**:
  ```json
  {
    "maintenance": true,
    "telegram": "https://t.me/attacker_channel"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (Settings can only be written by the supreme super admin `alQaidPro@gmail.com`).

### Case 8: ID Poisoning Denial-of-Wallet Attempt
- **Path**: `/channels/junk_id_string_that_is_extremely_long_over_128_characters_long_which_causes_wallet_draining_due_to_huge_key_storage_and_indexing_overhead`
- **User Context**: Authenticated as channels supervisor
- **Attempt**: Save a stream record with a 20KB document URL to crash query operations or waste resources.
- **Payload**:
  ```json
  {
    "id": "long_junk_id...",
    "name": "beIN Sports HD"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (blocked by `isValidId()` regex + size check).

### Case 9: Unauthorized Reads on Supervisor Catalog values
- **Path**: `/supervisors/super_secrets`
- **User Context**: Authenticated as normal `channels` supervisor
- **Attempt**: Read list of other supervisors, their passwords, or profiles to find leak credentials.
- **Payload**: `GET /supervisors/`
- **Expectation**: `PERMISSION_DENIED` (Supervisors catalog is readable only by the super-owner `alQaidPro@gmail.com`).

### Case 10: State Bypass (Directly editing read views count to millions)
- **Path**: `/series/s1`
- **User Context**: Authenticated as standard Series supervisor
- **Attempt**: Inflate view numbers directly bypassing client triggers.
- **Payload**:
  ```json
  {
    "views": 999999
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (Supervisors cannot modify read-only counters without super admin action, or must follow exact updates rules).

### Case 11: Spoofed Server Timestamps
- **Path**: `/supervisors/s1`
- **User Context**: Intending to fake registration date.
- **Attempt**: Providing a modified offline registration timestamp (`2020-01-01`).
- **Payload**:
  ```json
  {
    "id": "s1",
    "createdAt": "2020-01-01T00:00:00Z"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (Must match rule-bound `request.time`).

### Case 12: Orphaned Entity Creation (Creating Series without ID schema matching name)
- **Path**: `/series/series_illegal_id`
- **User Context**: Authenticated series admin
- **Attempt**: Bypass validations.
- **Payload**:
  ```json
  {
    "id": "series_illegal_id",
    "title": ""
  }
  ```
- **Expectation**: `PERMISSION_DENIED` (fails strict `title.size() > 0` validation checks).
