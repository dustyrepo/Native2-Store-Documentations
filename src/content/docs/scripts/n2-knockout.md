---
title: n2-knockout
description: Setup and full config reference for n2-knockout, a FiveM melee knockout and downed system with skill-check recovery and impairment effects.
---

Melee knockout and downed system. Enough unarmed hits within a rolling window ragdolls the victim to the ground, invincible and screen-blacked, until they recover with a skill check and walk away impaired, then headachy. Bridges ESX, QBCore, and QBX automatically and can announce stand-ups into n2-chat.

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`
- **`ox_lib`** - hard dependency (`lib.notify`, `lib.skillCheck`).
- Framework bridge is auto-detected, not configured: `qbx_core` → `qb-core` → `es_extended`, checked in that order at both client and server. None running falls back to standalone (`Bridge.IsPlayerDead` always `false`).
- **n2-chat** - optional soft integration. Used only if `Config.ChatIntegration.Enabled` is true and n2-chat is started; calls its `GetDisplayName` and `SendInRange`/`ShowActionBubble` exports.

## Installation

1. Drop the `n2-knockout` folder into your resources directory.
2. Make sure `ox_lib` is installed.
3. Add `ensure n2-knockout` to `server.cfg`, after `ox_lib` and after whichever framework you run (bridge detection needs to see it already started).
4. No database or SQL setup required.
5. Edit `config.lua` to taste. The framework bridge self-detects - nothing to select manually.

## Configuration

All keys live under the global `Config` table in `config.lua`.

| Key | Default | Controls |
| --- | --- | --- |
| `Config.Debug` | `false` | Debug prints, and unlocks the `/n2ko` self-knockout test command. |
| `Config.MeleeWeapons` | `{ WEAPON_UNARMED = true }` | Which weapon hashes count as melee for triggering a knockout hit. |
| `Config.Knockout.HitsRequiredMin/Max` | `3` / `7` | Random hit threshold rolled per fight before the victim goes down. |
| `Config.Screen.FadeOutTime` | `0` ms | Screen fade-out time at the knockout moment. |
| `Config.Screen.BlackHoldTime` | `3500` ms | How long the screen stays black. |
| `Config.Screen.FadeInTime` | `500` ms | Fade back in once conscious. |
| `Config.Downed.MaxTime` | `90` s | Max time knocked out before auto stand-up. |
| `Config.Downed.HealthRegenPerSec` | `4` | Health regen per second while downed (out of 200). |
| `Config.Downed.SkillCheck.Enabled` | `true` | If false, pressing the stand-up key gets straight up instantly. |
| `Config.Downed.SkillCheck.Stages` | `{ easy, hard, medium }` | `ox_lib` skill-check stage sequence required to stand up. |
| `Config.Downed.SkillCheck.RetryDelay` | `2` s | Cooldown after a failed skill check before retrying. |
| `Config.Effects.Blur` | on, 15-20 s, 0.2 s transition | Post-standup vision blur and its randomized duration. |
| `Config.Effects.DrunkWalk.Enabled` | `true` | Drunk movement clipset during impairment. |
| `Config.Effects.CameraSway` | on, intensity `0.3` | Camera sway during impairment (0.0-1.0). |
| `Config.Effects.SlowMovement` | on, ×`0.4` | Movement speed multiplier while impaired. |
| `Config.Effects.ShootBlock.Enabled` | `true` | Blocks firing/aiming while impaired. |
| `Config.Effects.Trip` | on, 30% chance / 2 s check / 1200 ms ragdoll | Chance to stumble briefly while impaired and moving. |
| `Config.Effects.MuffledAudioScene` | `'AH_3A_KO_EXPLOSION'` | GTA audio scene during impairment; set `nil` to disable. |
| `Config.Headache` | on, 60 s | Lingering effect after impairment ends. |
| `Config.Headache.Shake` | on, `LARGE_EXPLOSION_SHAKE`, intensity 0.9, every 5-15 s | Random camera-shake spikes during the headache. |
| `Config.Headache.SlowMovement` | on, ×`0.8` | Movement slowdown during the headache. |
| `Config.Sounds.Volume` | `0.1` | Playback volume (0-1) for custom sounds. |
| `Config.Sounds.EarRinging` | `'earring.mp3'` | File under `sounds/` played as the screen fades back in. |
| `Config.ChatIntegration.Enabled` | `true` | Announce stand-up into n2-chat if it's running. |
| `Config.ChatIntegration.Message` | `'slowly stands up after being knocked out.'` | Text appended after the player's name. |
| `Config.ChatIntegration.Color` | `'#C48EC4'` | Hex color of the chat message. |
| `Config.ChatIntegration.Range` | `10.0` | Radius other players must be within to see the message/action bubble. |

## Commands

| Command | Description |
| --- | --- |
| `/n2_standup` | Client. Bound to <kbd>E</kbd> by default via `RegisterKeyMapping`. Attempts to stand up when knocked out, running the configured skill check unless `SkillCheck.Enabled` is false. |
| `/n2ko` | Server. Force-knocks-out the calling player. Only works with `Config.Debug = true`; otherwise the player gets an error notification. Must be run by a player, not the server console. |

## Exports / Events

No exports of its own - it only calls into n2-chat's. Net events:

- `n2-knockout:client:setKnockedOut` - server → client, enters the knockout state.
- `n2-knockout:client:notify(msg, type)` - server → client, generic notification passthrough.
- `n2-knockout:server:meleeHit(attackerNetId)` - client → server, reports a detected melee hit; server validates distance (≤5.0 units) before counting it toward the threshold.
- `n2-knockout:server:standUpAnnounce` - fired as the getup animation starts; triggers the optional n2-chat announcement.
- `n2-knockout:server:standUp` - fired once fully stood up; clears the player's downed state.

Also hooks `gameEventTriggered` (client, to detect unarmed hits), `onResourceStop` (client, cleans up effects/ragdoll if the resource stops mid-knockout), and `playerDropped` (server, clears downed state on disconnect).

## NUI & locale

`html/index.html` is a transparent, non-interactive background page whose only job is audio playback - `client/sounds.lua` sends one-way `playSound`/`stopSound` messages, no callbacks. `locales/en.lua` holds 5 short player-facing strings; only English ships.

## Notes

:::note
Bridge load order is `qbx.lua` → `qbcore.lua` → `esx.lua`, each guarding against overriding an already-set framework - if multiple framework resources are somehow started, QBX wins.
:::

:::note
Melee chip damage is actively healed back every frame outside the counted-hit flow (including a last-resort resurrect-on-death safety net). Running another damage/medical system alongside unarmed-hit handling could conflict with this.
:::

:::caution[Leave `Config.Debug` off in production]
Besides logging, it unlocks `/n2ko`, a self-knockout command available to every player.
:::

Source: `[Native2]/n2-knockout/` (fxmanifest.lua, config.lua, client/, server/, bridge/, shared/bridge.lua, locales/en.lua).
