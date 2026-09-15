---
title: n2-shops
description: Setup and full config reference for n2-shops, a FiveM convenience-store system with shelf stocking, a clerk AI, shoplifting detection, and register robbery.
---

A 24/7-style convenience-store system: grabbable shelf items with live stock state, a server-authoritative clerk NPC that greets, patrols, restocks, and remembers shoplifters, pay-or-get-caught shoplifting with police dispatch, and a gunpoint or dead-clerk register-robbery minigame. Ships 8 pre-placed vanilla-map stores and 5 edited shelf prop models.

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`
- **`ox_lib`, `ox_target`, `ox_inventory`** - must be installed and started before this resource (see Installation).
- **Framework** - self-registering bridge, resolved by priority: `qbx_core` (100) → `qb-core` (90) → `es_extended` (80). None are hard dependencies; with none started, purchases/robbery payouts silently do nothing and the console prints a warning. Each framework bridge also reports on-duty police count (used by `Config.RegisterRobbery.minCops`) - QBX via `qbx_core`'s duty export, QBCore via `QBCore.Functions.GetDutyCount`, ESX by counting on-duty `police` job players directly.
- **Dispatch (optional)** - same pattern: `n2-mdt` (100) → `cd_dispatch` (90) → `qbx_police` (80). With none running, alerts just print to console.
- **Stream assets** - `stream/v_ret_247shelves01-05.yft`, five edited shelf models that *replace* the stock GTA props of the same name.

## Installation

1. Install and start `ox_lib`, `ox_target`, `ox_inventory`, and a supported framework **before** n2-shops.
2. Copy the folder into `resources/[Native2]/n2-shops/`.
3. Remove every existing/default store entry from `ox_inventory`'s `data/shops.lua` - leftover stock shops at the same coordinates conflict with the stores this resource manages. Ammunation and liquor stores aren't supported yet.
4. The `stream/` shelf models replace stock props automatically once the resource runs - no separate step.
5. Add `ensure n2-shops` to `server.cfg`, after ox_lib/ox_target/ox_inventory/your framework.
6. Add every item in `Config.Items` (`config/shelves.lua`) to `ox_inventory`'s items table: `water`, `soda`, `burger`, `sandwich`, `bread`, `butter`, `cheese`, `devkit_lays`, `devkit_milkduds`.
7. Before going live, review `config/stores.lua` (coordinates are hand-captured for the vanilla map), `Config.CaughtMemory.mode`, `Config.RegisterRobbery` payout/timing, and `Config.BlockedProps`.

:::note
No database/SQL setup - all state (shelf stock, debt tabs, clerk bookkeeping, robbery cooldowns) is in memory. A resource or server restart clears it, except `'timed'`/`'never'`-mode caught-shoplifter memory, which persists via framework player metadata.
:::

## Configuration

### config/stores.lua

| Key | Default | Controls |
| --- | --- | --- |
| `Config.Debug` | `false` | Gates `/calibrateshelf`, `/createshop`, and `/n2shops_debugzones`. Leave off in production. |
| `Config.BlockedProps` | e.g. `v_ret_247_fruit` | Model names deleted on sight anywhere in the world (1s poll) - stock clutter that clips through the custom shelves. |
| `Config.Blips.enabled` | `true` | Shows a map blip per store, placed at the clerk's coordinates and labeled with the store name. |
| `Config.Blips.sprite` / `color` / `scale` | `52` / `2` / `0.8` | Standard GTA blip sprite ID, color index, and scale for the store blips. |
| `Config.CaughtMemory.mode` | `'resource'` | `'resource'` (cleared on resource/server restart), `'timed'` (persists via framework metadata, expires after `duration` minutes), `'never'` (persists forever). |
| `Config.CaughtMemory.duration` | - | Minutes before `'timed'`-mode caught memory expires; ignored for the other modes. |
| `Config.RegisterRobbery.minCops` | `0` | Minimum on-duty cops required before a robbery can start, sourced from the active framework bridge's duty count. `0` means unenforced. |
| `Config.RegisterRobbery.threatWindow` | `15000` ms | How long "Force Register Open" stays available after aiming at the clerk. |
| `Config.RegisterRobbery.ticks` / `tickInterval` | `10` / `3000` ms | 10 payouts every 3s = 30s full drain. |
| `Config.RegisterRobbery.cashMin` / `cashMax` | `10` / `30` | Cash per drip. |
| `Config.RegisterRobbery.policeDelay` | `10000` ms | Delay after the first drip before the dispatch alert fires. |
| `Config.RegisterRobbery.cooldown` | `600000` ms (10 min) | Per-store cooldown after a robbery ends or is interrupted. |
| `Config.RegisterRobbery.respawnDelay` | `600000` ms (10 min) | Delay after the clerk's death before it respawns. |

`Config.Stores` is an array of 8 stores, each with: `label`; `clerk` (model, home coords as a vec4 with heading, patrol stops with coords/heading/anim); `counters`/`registers` (box zones); `doors` (box zones, with optional per-door `axis`/`invert` tuning - see Notes); `backroom` (a single box or poly zone). All 8 stores share the same structure - only the hand-captured coordinate values differ.

### config/shelves.lua

- `Config.GrabAnims` - `high`/`mid`/`low` anim dict+clip, matched to a shelf slot's height tier.
- `Config.Restock.animDuration` (`3000` ms) - how long the clerk's restock animation plays per item.
- `Config.ShelfProps.rotationJitterDeg` (`360`) - each spawned prop gets a random rotation within this range for a less uniform look on the shelf. Set a product's `rotate = false` (e.g. packaged/boxed items like `sodaPack`, `chips`, `bread`) to keep it upright instead.
- Products are defined once each, keyed by prop-key, with `prop` (one or more real GTA model names), `item` (the `ox_inventory` item it grants), `price` (added to the player's store tab on grab, not charged immediately), and optional `rotate`. `Config.Props`, `Config.Items`, and `Config.Prices` are all generated from this one table, so adding a product only means adding one entry, not three.
- `Config.Shelves[shelfModelHash]` - per shelf model, an array of `slot(productKey, bonePrefix, count)` calls, each expanding to `count` numbered bones (`bonePrefix .. 1`, `bonePrefix .. 2`, ...) mapped to that product. Use `/calibrateshelf` to add slots for a shelf model that has none yet - it prints the exact `slot(...)` line to paste in.

### config/shelf_offsets.lua

`Config.ShelfBoneOffsets[shelfHash][boneName]` - per-bone local attach offset (`x, y, z, rx, ry, rz`) plus a height `tier`. Entirely generated by the in-game calibration tool (`/calibrateshelf`); not meant to be hand-edited except to paste tool output in.

## Features

### Store zones

Each store's `doors` array drives shoplifting-exit detection, deliberately **not** built on ox_lib's shared zone poller (its 300ms sample rate is too slow for a player sprinting across a ~1.5-unit doorway). Instead every door runs its own per-frame check within 15 units, falling back to a 1s poll otherwise. Crossing inward fires `enteredStore`; crossing outward fires `checkPaid`, which resolves to a "thanks, bye" or a caught-shoplifting reaction depending on unpaid debt. A door's inside/outside side is computed from local X or Y after de-rotating by heading, with an optional `invert` flag - both hand-captured and verified in-game via `/n2shops_debugzones`. Backroom zones are plain ox_lib box/poly zones (room-sized, no thin-doorway timing issue).

A map blip per store (`Config.Blips`) is placed at the clerk's coordinates and labeled with the store name, so players can find their nearest 24/7 without needing to already know where one is.

### Shelf stocking / grabbing

The client polls the world every 1s for shelf props and "stocks" them: spawns one prop per configured slot (skipping slots the server already reports taken), attached via bone offset with a random cosmetic rotation jitter, frozen/invincible/collidable so the engine doesn't reclaim it as disposable population. Each prop becomes an ox_target "Take X" option; selecting it opens a quantity dialog, then requests a grab per unit (rate-limited 300ms/grab). The server validates the slot, adds the item to inventory **immediately on grab** (not on payment), marks the slot taken for every client, adds the price to that player's per-store debt tab, and queues a restock. The shelf itself also carries a "Put Back Item" option that reverses the most recent grab from that shelf: removes the item from inventory, frees the slot again for every client, and refunds the price from the player's debt tab. Debt is only settled at the counter or forced at the door on exit - walking out with unpaid debt clears it silently but marks the player caught and dispatches a "Shoplifting" alert. Restocks for a whole visit are batched and queued 5s after the player leaves or pays, not per-grab.

### Clerk AI

Fully server-authoritative: the server is the single source of truth for patrol, speech, and reactions, and broadcasts the resulting commands to every client within 40 units of that store; clients only spawn the shared networked ped and play back what they're told. Only one client at a time "owns" spawning a given store's clerk (server-side claim with a 10s safety timeout), and a per-store busy flag with an epoch counter gates patrol/confront/holdup/restock so only one behavior drives the clerk at once.

- **Greet** - entering a store plays a greet line, at most once per 60s per store, unless the player is marked caught at that store.
- **Patrol** - every ~30-60s while not busy, a 30% chance to walk to the next patrol stop, play its idle anim, dwell 10-15s, then walk back.
- **Shoplifter recognition** - a player marked caught gets confronted and shoved on entry instead of greeted, up to 5 times over a visit if they don't leave.
- **Backroom enforcement** - entering the backroom triggers the same confront-and-shove flow regardless of history.
- **Restock** - queued shelf grabs are visited in one trip (not round-tripping to the counter between items), with the tier-appropriate grab anim per stop.
- **Homing recovery** - if no client was in range to run the walk-back navigation, the clerk is marked `needsHoming` and a recovery loop retries every 2s until it succeeds.
- **Pay** - available at the counter (clerk home) or directly on the clerk otherwise; settles the player's debt tab, failing cleanly on insufficient funds.

### Register robbery

Two flows, both a 30s drip of $10-30 every 3s into the robber's account, one looter at a time per store:

- **Gunpoint ("Force Register Open")** - aiming a firearm at a live clerk within 10 units opens a 15s threatened window; interacting with a register during that window (staying within 3 units, weapon equipped, for the whole drip) starts it. A dispatch alert fires 10s after the first payout. 10-minute cooldown per store after the drip ends or is interrupted.
- **Loot dead register ("Loot Register")** - only available after the clerk is killed, no weapon requirement, same drip mechanics, claimable once per death-cycle. Killing the clerk always dispatches a "Shooting" alert immediately, separate from the robbery alert; the clerk respawns after 10 minutes.

### Dispatch

Same self-registering priority pattern as the framework bridge (see Dependencies). Called for shoplifting, armed robbery, and clerk-killed events; with no bridge matched, it just prints to console instead of erroring. On-duty cop count for `Config.RegisterRobbery.minCops` comes from the framework bridge (ESX, QBCore, and QBX all report it), not from the dispatch bridge.

### Dev-only tools

All gated behind `Config.Debug = false` by default - not meant to ship enabled:

- `/calibrateshelf` - an in-game freecam/raycast tool to build new shelf slot layouts from scratch, exporting ready-to-paste config snippets to the F8 console. The source comments say to delete this file once a shelf's layout is finalized.
- `/createshop` - builds a whole `Config.Stores` entry in-game: walk to a spot and select "Set Clerk Position" or "Add Patrol Point" to capture it, or use the same corner-to-corner freecam flow as `/calibrateshelf` to place counters, registers, doors, and the backroom. Exports a ready-to-paste `Config.Stores` block to the F8 console.
- `/n2shops_debugzones` - toggles wireframe drawing for every zone the resource creates. Safe to leave in for admin use, or remove for production.

A third file, `client/blocked_props.lua`, is *not* debug-gated - it's the always-on `Config.BlockedProps` cleanup poll, unrelated to the two calibration/debug tools above.

## Commands

:::caution
All three commands are dev-only and no-op entirely unless `Config.Debug = true`.
:::

| Command | Description |
| --- | --- |
| `/calibrateshelf` | Client. Opens the shelf calibration menu. |
| `/createshop` | Client. Opens the shop creator menu. |
| `/n2shops_debugzones` | Client. Toggles zone wireframe debug drawing. |

## Exports / Events

No exports are defined by n2-shops for other resources to call - it calls out to `ox_target`, `ox_inventory` (`AddItem`), and optionally the framework and dispatch bridges' own exports.

**Net events** (all internal, `n2-shops:` prefixed) - client → server: `enteredStore`, `checkPaid`, `enteredBackroom`/`leftBackroom`, `clerkSpawned`, `threatenClerk`, `clerkKilled`, `server:stopRegisterRobbery`. Server → client broadcasts: `clerkWalkTo`, `clerkFaceHeading`/`clerkFacePoint`, `clerkPlayAnim`/`clerkStopAnim`, `clerkSpeech`, `clerkHoldUp`/`clerkHoldUpEnd`, `clerkShove`/`clerkStopShove`, `pushPlayer`, `clerkPhoneCall`, `clerkAtCounter`, `slotTaken`/`slotRestocked`, `clerkThreatened`, `clerkDied`/`clerkRespawn`, `registerRobberyEnded`.

**Callbacks** (`lib.callback`): `getClerkNetId`, `getShelfState`, `grabShelfItem`, `putBackShelfItem`, `getTab`, `payTab`, `isCaught`, `server:startRegisterRobbery`, `server:startLootRegister`.

## Notes

:::note
Items are granted to inventory at the moment of grabbing, before payment - "theft" only becomes real (caught + dispatched) if the player leaves without paying. A grab can be undone with the shelf's "Put Back Item" option (refunds the debt), but only for the most recent grab from that shelf while it's still marked taken.
:::

:::note
Clerk behavior is server-decided and broadcast to clients, not decided per-client - this keeps what every player sees in sync.
:::

:::note
Per-store coordinate blocks (clerk, patrol, counters, registers, doors, backroom) are hand-captured per location. When customizing `config/stores.lua` for a different map or store, double-check each door's `axis`/`invert` values with `/n2shops_debugzones`.
:::

Source: `[Native2]/n2-shops/` (INSTALLATION.txt, fxmanifest.lua, config/, client/, server/, bridge/).
