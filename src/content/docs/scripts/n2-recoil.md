---
title: n2-recoil
description: Setup and full config reference for n2-recoil, a FiveM weapon recoil script with per-category tuning, job multipliers, and aim sway.
---

Client-only weapon recoil control. Watches ammo count and kicks the gameplay camera per shot, with per-weapon-category tuning, job-based multipliers, and free-aim sway. The player has to pull the camera back down themselves; nothing auto-recenters.

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`
- No hard resource dependency. If `qbx_core`, `qb-core`, or `es_extended` is already started, it's auto-detected (via `GetResourceState`) purely to enable job-based recoil multipliers - none of them are required for the script to run.
- `escrow_ignore { 'config.lua' }` - config stays editable even when the rest of the resource is escrowed.

## Installation

1. Drop the `n2-recoil` folder into `resources/` (any category, e.g. `[Native2]`).
2. Add `ensure n2-recoil` to `server.cfg`.
3. Edit `config.lua` to taste. No database and no exports to wire up from other resources.

## Configuration

All keys live in `config.lua`.

| Key | Default | Controls |
| --- | --- | --- |
| `Config.Enabled` | `true` | Master on/off switch for the whole recoil loop. |
| `Config.Debug` | `false` | Prints job-multiplier and per-shot debug lines to the client console. |
| `Config.Multiplier` | `8.0` | Global recoil scale applied to every shot. |
| `Config.AimMultiplier` | `0.7` | Extra multiplier applied only while aiming down sights, stacked on `Multiplier`. |
| `Config.Chance` | `50` | 1-100 chance rolled per shot for a "full" kick; a miss still kicks, just scaled down. |
| `Config.MissMultiplier` | `0.5` | Scale applied to the kick when the `Chance` roll misses. |
| `Config.Sway` | `true` | Enables camera sway/wobble while free-aiming, independent of firing. |
| `Config.SwayStrength` | `0.5` | Amplitude of the engine's `DRUNK_SHAKE` camera shake used for sway. |
| `Config.Jobs.enabled` | `true` | Enables per-job recoil multipliers (auto-detects ESX / QBCore / QBX). |
| `Config.Jobs.onDutyOnly` | `true` | Job multiplier only applies while on duty (frameworks without a duty concept always count as on duty). |
| `Config.Jobs.multipliers` | `police/sheriff/bcso/sast = 0.7, doj = 0.85, ambulance = 0.9` | Per-job recoil multiplier; unlisted jobs get `1.0`. |

### Recoil categories

`Config.Categories` gives each weapon category a base vertical/horizontal recoil value:

| Category | Vertical | Horizontal |
| --- | --- | --- |
| pistol | 0.85 | 0.50 |
| revolver | 1.40 | 0.60 |
| smg | 0.70 | 0.45 |
| rifle | 1.20 | 0.55 |
| carbine | 1.10 | 0.50 |
| shotgun | 1.80 | 0.70 |
| lmg | 1.30 | 0.60 |
| sniper | 4.11 | 0.53 |
| marksman | 2.20 | 0.55 |

Two more maps build on top of categories, both in `config.lua`:

- `Config.Weapons` - assigns each of the ~50 base-game weapon hashes to one category above.
- `Config.Groups` - fallback for weapons not listed in `Config.Weapons` (e.g. addon weapons), resolved via the engine's weapon-type group.
- `Config.Overrides` - per-weapon fine-tuning for ~17 weapons, e.g. `WEAPON_HEAVYSNIPER = { vertical = 6.52 }`, applied on top of the category default.

Any weapon missing from all three gets no recoil at all.

## Commands

None. This resource has no player-facing or console commands.

## Exports / Events

No exports and no custom net events. It only listens for framework events to keep the job multiplier current:

- ESX: `esx:setJob`, `esx:playerLoaded`, `esx:onPlayerLogout`
- QBCore / QBX: `QBCore:Client:OnJobUpdate`, `QBCore:Client:OnPlayerLoaded`, `QBCore:Client:OnPlayerUnload`, `QBCore:Client:SetDuty`
- Engine: `onResourceStop`, to stop the sway effect cleanly if the resource is stopped mid-effect.

## Notes

:::note
Recoil is detected from ammo-count deltas polled at up to frame rate while firing, not a "shot fired" event. A burst of more than 5 rounds between polls is treated as something other than firing (e.g. unequip) and ignored - relevant only for extreme fire rates on a struggling client.
:::

:::note
Camera pitch is hard-capped at 70 degrees regardless of config - that's the engine's practical gameplay-camera limit, not a bug.
:::

:::caution[No framework running]
Job multipliers silently fall back to `1.0` instead of erroring. This only surfaces in the log with `Config.Debug = true`.
:::

Source: `[Native2]/n2-recoil/` (fxmanifest.lua, config.lua, client/client.lua).
