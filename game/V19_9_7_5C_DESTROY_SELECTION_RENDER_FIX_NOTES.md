# V19.9.7.5c — Destroyed Unit Selection Render Fix

- Fixed a battlefield render crash after a Unit is destroyed.
- A missing selected Unit could incorrectly match an unmounted Unit because both optional rider IDs were undefined.
- Selected-unit controls now require a real selected Unit.
- Added a defensive guard so stale selection state cannot remove half the board during rendering.
- Updated the battlefield script cache version.
