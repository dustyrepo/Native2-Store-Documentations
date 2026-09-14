---
title: n2-shops
description: Setup and full config reference for n2-shops, a FiveM convenience-store system with shelf stocking, a clerk AI, shoplifting detection, and register robbery.
---

A 24/7-style convenience-store system: grabbable shelf items with live stock state, a server-authoritative clerk NPC that greets, patrols, restocks, and remembers shoplifters, pay-or-get-caught shoplifting with police dispatch, and a gunpoint or dead-clerk register-robbery minigame. Ships 8 pre-placed vanilla-map stores and 5 edited shelf prop models.

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`

:::caution[No `dependencies` block in `fxmanifest.lua`]
`ox_lib` is loaded as a shared script (so it must exist and start first or the resource errors), and `ox_target`/`ox_inventory` are called at runtime via their exports with no manifest-level enforcement. INSTALLATION.txt describes all three as dependencies - only the manifest itself doesn't say so. Worth adding a real `dependencies` array.
:::

- **Framework** - self-registering bridge, resolved by priority: `qbx_core` (100) → `qb-core` (90) → `es_extended` (80). None are hard dependencies; with none started, purchases/robbery payouts silently do nothing and the console prints a warning.
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
| `Config.Debug` | `false` | Gates `/calibrateshelf` and `/n2shops_debugzones`. Leave off in production. |
| `Config.BlockedProps` | e.g. `v_ret_247_fruit` | Model names deleted on sight anywhere in the world (1s poll) - stock clutter that clips through the custom shelves. |
| `Config.CaughtMemory.mode` | `'resource'` | `'resource'` (cleared on resource/server restart), `'timed'` (persists via framework metadata, expires after `duration` minutes), `'never'` (persists forever). |
| `Config.CaughtMemory.duration` | - | Minutes before `'timed'`-mode caught memory expires; ignored for the other modes. |
| `Config.RegisterRobbery.minCops` | `0` | Minimum on-duty cops required before a robbery can start. Unenforced at `0` unless a dispatch bridge reports a real count. |
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
- `Config.Props` - prop-key → one or more real GTA model names (some keys round-robin between visually different models, e.g. three different chip-bag props).
- `Config.Items` - prop-key → `ox_inventory` item name. Several visually distinct prop keys can map to the same item.
- `Config.Prices` - prop-key → cash price per unit, added to the player's store tab on grab (not charged immediately).
- `Config.Shelves[shelfModelHash]` - per shelf model, slot groups built from bone-name ranges (e.g. `Chips1`..`Chips6`) mapped to a prop key.

:::caution[`v_ret_247shelves02` has no configured slots]
Its bone offsets exist in `config/shelf_offsets.lua` and the model ships as a stream asset, but `Config.Shelves` has no entry for it - it's a replaced prop with zero grabbable items right now, effectively decorative until calibrated.
:::

### config/shelf_offsets.lua

`Config.ShelfBoneOffsets[shelfHash][boneName]` - per-bone local attach offset (`x, y, z, rx, ry, rz`) plus a height `tier`. Entirely generated by the in-game calibration tool (`/calibrateshelf`); not meant to be hand-edited except to paste tool output in.

## Features

### Store zones

Each store's `doors` array drives shoplifting-exit detection, deliberately **not** built on ox_lib's shared zone poller (its 300ms sample rate is too slow for a player sprinting across a ~1.5-unit doorway). Instead every door runs its own per-frame check within 15 units, falling back to a 1s poll otherwise. Crossing inward fires `enteredStore`; crossing outward fires `checkPaid`, which resolves to a "thanks, bye" or a caught-shoplifting reaction depending on unpaid debt. A door's inside/outside side is computed from local X or Y after de-rotating by heading, with an optional `invert` flag - both hand-captured and verified in-game via `/n2shops_debugzones`. Backroom zones are plain ox_lib box/poly zones (room-sized, no thin-doorway timing issue).

### Shelf stocking / grabbing

The client polls the world every 1s for shelf props and "stocks" them: spawns one prop per configured slot (skipping slots the server already reports taken), attached via bone offset, frozen/invincible/collidable so the engine doesn't reclaim it as disposable population. Each prop becomes an ox_target "Take X" option; selecting it opens a quantity dialog, then requests a grab per unit (rate-limited 300ms/grab). The server validates the slot, adds the item to inventory **immediately on grab** (not on payment), marks the slot taken for every client, adds the price to that player's per-store debt tab, and queues a restock. Debt is only settled at the counter or forced at the door on exit - walking out with unpaid debt clears it silently but marks the player caught and dispatches a "Shoplifting" alert. Grabbed items stay in inventory even if caught. Restocks for a whole visit are batched and queued 5s after the player leaves or pays, not per-grab.

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

Same self-registering priority pattern as the framework bridge (see Dependencies). Called for shoplifting, armed robbery, and clerk-killed events; with no bridge matched, it just prints to console instead of erroring. Cop-count reporting (used by `Config.RegisterRobbery.minCops`) is only implemented by the `qbx_police` bridge - without it, the minimum-cops gate is unenforced.

### Dev-only tools

Both gated behind `Config.Debug = false` by default - not meant to ship enabled:

- `/calibrateshelf` - an in-game freecam/raycast tool to build new shelf slot layouts from scratch, exporting ready-to-paste config snippets to the F8 console. The source comments say to delete this file once a shelf's layout is finalized.
- `/n2shops_debugzones` - toggles wireframe drawing for every zone the resource creates. Safe to leave in for admin use, or remove for production.

A third file, `client/blocked_props.lua`, is *not* debug-gated - it's the always-on `Config.BlockedProps` cleanup poll, unrelated to the two calibration/debug tools above.

## Commands

:::caution
Both commands are dev-only and no-op entirely unless `Config.Debug = true`.
:::

| Command | Description |
| --- | --- |
| `/calibrateshelf` | Client. Opens the shelf calibration menu. |
| `/n2shops_debugzones` | Client. Toggles zone wireframe debug drawing. |

## Exports / Events

No exports are defined by n2-shops for other resources to call - it calls out to `ox_target`, `ox_inventory` (`AddItem`), and optionally the framework and dispatch bridges' own exports.

**Net events** (all internal, `n2-shops:` prefixed) - client → server: `enteredStore`, `checkPaid`, `enteredBackroom`/`leftBackroom`, `clerkSpawned`, `threatenClerk`, `clerkKilled`, `server:stopRegisterRobbery`. Server → client broadcasts: `clerkWalkTo`, `clerkFaceHeading`/`clerkFacePoint`, `clerkPlayAnim`/`clerkStopAnim`, `clerkSpeech`, `clerkHoldUp`/`clerkHoldUpEnd`, `clerkShove`/`clerkStopShove`, `pushPlayer`, `clerkPhoneCall`, `clerkAtCounter`, `slotTaken`/`slotRestocked`, `clerkThreatened`, `clerkDied`/`clerkRespawn`, `registerRobberyEnded`.

**Callbacks** (`lib.callback`): `getClerkNetId`, `getShelfState`, `grabShelfItem`, `getTab`, `payTab`, `isCaught`, `server:startRegisterRobbery`, `server:startLootRegister`.

## Notes

:::caution[Manifest dependency gap]
`ox_lib`/`ox_target`/`ox_inventory` are documented as dependencies but not declared in `fxmanifest.lua` - only enforced by load order in `server.cfg`.
:::

:::caution[`n2-mdt` dispatch bridge is undocumented]
It exists in source and is the highest-priority of the three dispatch bridges, but isn't mentioned anywhere in INSTALLATION.txt.
:::

:::note
Items are granted to inventory at the moment of grabbing, before payment - "theft" only becomes real (caught + dispatched) if the player leaves without paying. There's no way to un-grab an item.
:::

:::note
Clerk behavior is intentionally server-decided and broadcast, not decided per-client - the project's own developer notes explicitly warn that letting a client decide clerk behavior independently would desync what different players see.
:::

:::note
Per-store coordinate blocks (clerk, patrol, counters, registers, doors, backroom) are hand-captured for the default vanilla-map stores and have a history of copy-paste mistakes (coordinates from the wrong store, mismatched door `axis`/`invert`) - worth double-checking when customizing `config/stores.lua`.
:::

Source: `[Native2]/n2-shops/` (INSTALLATION.txt, fxmanifest.lua, config/, client/, server/, bridge/).
