---
title: n2-chat
description: Setup and full config reference for n2-chat, a standalone FiveM chat replacement with RP commands, scene markers, and moderation tools.
---

A standalone, SA-MP-style chat replacement: floating proximity text, a full set of RP commands, persistent world-placed roleplay notes, per-player languages, moderation, and a phone-call relay. Ships its own NUI and a `RegisterCommand`/export API other resources hook into.

:::tip
This resource ships an unusually complete `README.md` in its own folder - treat this page as the fast-reference version and the README as the exhaustive one (it includes the full 30+ command table and troubleshooting guide verbatim).
:::

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`
- **`oxmysql`** - hard dependency, required even if Scene Markers are disabled in config (it's declared at the manifest level). Used to persist the `n2_chat_scenes` table, created automatically.
- Optional, config-driven only (not manifest dependencies): ESX / QBCore / ox_core for display names, an emote resource as fallback, and lb-phone / qb-phone / qs-smartphone for the call relay.

## Installation

1. Copy the `n2-chat` folder into `resources/`.
2. Make sure `oxmysql` is installed and `ensure`d **before** n2-chat in `server.cfg`.
3. Add `ensure n2-chat`.
4. Restart the server, or `refresh` + `ensure n2-chat` from console.
5. No manual database migration - `n2_chat_scenes` is created on first start.

## Configuration

Every config file shares one global `Config` table (`Config = Config or {}`) - the split into files is purely organizational. `general.lua` must load before `weapons.lua`, which fxmanifest already gets right; don't reorder `shared_scripts`.

### general.lua - framework, keys, ranges, core behavior

| Key | Controls |
| --- | --- |
| `Config.Framework` | `'none'` / `'esx'` / `'qbcore'` / `'ox'` - only affects the displayed name. |
| `Config.FrameworkResource` | Override the resource name the framework is exported from. |
| `Config.CurrencySymbol` | Default `'$'`, used by `/cash`. |
| `Config.ChatKey` | Default `'T'` - rebindable under FiveM keybinds. |
| `Config.FreeLookKey` | Default `'LMENU'` (left Alt) - rebindable. |
| `Config.ChatRange`, `Config.Ranges` | Default proximity range, plus per-type ranges (normal, whisper, shout, me, do, b, low, long). |
| `Config.MaxMessages` / `MaxInputHistory` / `MaxMessageLength` | History buffer size, arrow-key recall depth, per-message character cap. |
| `Config.FloodProtection` | `{ enabled, maxMessages, interval, muteDuration }` |
| `Config.AdminPermission` | Default ACE `'n2-chat.admin'`, plus `DefaultMuteDuration`, `AdminChatTag`, and optional framework permission-group gating. |
| `Config.Languages` | `{ enabled, list, default, autoDetectFromFramework, nationalityMap }` |
| `Config.Emotes` | `{ enabled, fallbackToNativeCommand, fallbackCommandName, announceInChat, list }` |
| `Config.GrammarCorrection` | `{ enabled, capitalizeFirst, capitalizeStandaloneI, endPunctuation, defaultPunctuation }` |
| `Config.Commands` | Per-command enable/disable table. |

### appearance.lua - visuals

| Key | Controls |
| --- | --- |
| `Config.EnableFade` / `FadeTime` / `FadeDuration` | Message fade-out behavior. |
| `Config.Position`, `Width`, `Height`, `FontSize`, `LineHeight`, `FontFamily` | Chat window geometry and type. |
| `Config.Colors`, `ColorLabels`, `ColorOrder` | Default hex per message type, plus labels/ordering. |
| `Config.Timestamps.format` | One of `24h` / `12h` / `24h-sec` / `12h-sec`. |
| `Config.MenuAccentColor` | Single hex re-theming `/chatsettings` and the scene UI. |
| `Config.TypingIndicator` | `{ enabled, text, color }` |
| `Config.ActionBubble` | `{ duration, color }` - used by `/ame` / `/amy`. |
| `Config.DistanceIntensity` | `{ enabled, minOpacity, minScale }` - fades/shrinks text by distance. |
| `Config.ClientSettings` | Default `/chatsettings` values for typing indicator and timestamps. |

### moderation.lua - flood, admin, filter, webhooks

| Key | Controls |
| --- | --- |
| `Config.WordFilter` | `{ enabled, action: 'censor'\|'block', replacement, words }` - `words` is empty by default. |
| `Config.DiscordWebhooks` | `{ username, avatarUrl, includeIdentifiers, chat, reports, moderation }` - each a webhook URL, off by default. |

### weapons.lua - weapon-draw auto `/me`

| Key | Controls |
| --- | --- |
| `Config.WeaponMe` | `{ enabled, template, fallbackName, cooldown, includeGroups, range }` |
| `Config.WeaponNames` | Weapon literal → `{ label, group }`. Unlisted weapons never trigger the auto-`/me`. |

### phone.lua - call relay

| Key | Controls |
| --- | --- |
| `Config.PhoneCallRelay.enabled` | Default `true`. |
| `Config.PhoneCallRelay.script` | `'lb-phone'` (default) / `'qb-phone'` / `'qs-smartphone'` - which phone resource to hook. |
| `Config.PhoneCallRelay.types` | `{ say = true, shout = true, low = true }` - which chat types relay into an active call. |
| `Config.PhoneCallRelay.prefix` | Default `'[Call] '`, prefixed to relayed lines. |

### scenes.lua - scene markers

| Key | Controls |
| --- | --- |
| `Config.SceneMarkers.enabled`, `maxTextLength` | Default `200` characters. |
| `durations`, `radius`, `removeRadius` | 1-5 days lifetime; trigger radius default `5`, delete radius default `10`. |
| `markerType` / `markerColor` / `markerScale` | World marker appearance. |
| `cleanupInterval`, `checkInterval`, `triggerCooldown`, `createCooldown` | Expiry sweep and anti-spam timers. |

### locale.lua / locale-de.lua

Every user-facing string is keyed in `locale.lua` (English, default). A German set ships as `locale-de.lua` but isn't wired in by default - swap the file in to use it.

## Commands

30+ commands total (full table in the README); the ones you'll actually configure around:

| Commands | Description |
| --- | --- |
| `/me`, `/ame`, `/amy`, `/my`, `/melow`, `/melong` | Roleplay action text, at various ranges. |
| `/do`, `/dolow`, `/dolong` | OOC-flavored scene description. |
| `/b`, `/ooc` | Local and global out-of-character chat. |
| `/w` / `/whisper`, `/l` / `/low`, `/cw`, `/cb`, `/s` / `/shout` | Volume-scoped speech variants. |
| `/pm`, `/r` / `/reply` | Private messages and quick-reply. |
| `/id`, `/report`, `/clear` / `/clearchat`, `/time`, `/togglechat`, `/chatsettings`, `/lang`, `/ag` | Utility, reporting, and personal settings (`/ag` toggles your own grammar correction). |
| `/cs` / `/createscene`, `/ds` / `/deletescene`, `/sa` / `/sceneadmin` | Scene markers (admin variant lists + teleports to all scenes). |
| `/cash`, `/info [id]` | Only exist when `Config.Framework ~= 'none'`. |
| `/mute [id] [s]`, `/unmute`, `/mutelist`, `/clearchatall`, `/a`/`/ac`, `/setnationality`, `/announcement` | Admin, gated by `Config.AdminPermission`. |
| `.wave` etc. | Dot-prefixed emotes from `Config.Emotes.list`, separate from slash commands. |

Every command can be toggled individually via `Config.Commands`.

## Scene markers

Persistent, database-backed RP notes placed with `/cs`: pick text and a 1-5 day duration, and a floating marker appears at that spot for everyone. Walking within the configured radius surfaces the note in chat as `[SCENE] <text>`. Enter/leave tracking, per-scene cooldowns, and auto-expiry are server-authoritative; `/sa` lists and teleports to every scene, `/ds` removes your own (or, as admin, any scene). Backed by an auto-created `n2_chat_scenes` table via `oxmysql`.

## Phone call relay

Relays `/say`, `/shout`, and `/low` lines to the sender's active call partner (tagged with the configured prefix) so calls don't require talking over voice - only when the partner isn't already in normal chat range for that message type. Implementation depends on `Config.PhoneCallRelay.script`:

- **lb-phone** (default) - listens to `lb-phone:callAnswered`/`callEnded`, which carry both participants directly. Confirmed against a live install per the source's own comments.
- **qb-phone** - reconstructs the pairing from `qb-phone:server:callContact` + `acceptCall`. Source comments flag this as unverified across forks.
- **qs-smartphone** - no call-connect event exists, so it polls `getActiveCallSession` every 2s and guesses a field name for the partner. Source comments say to log and adjust against a real install.

## Exports / Events

**Exports** (`exports['n2-chat']:...`, called server-side): `SendMessage`, `SendSystemMessage`, `Broadcast`, `SendInRange`, `RegisterCommand`, `RegisterCommandMeta`, `ClearChat`, `GetChatHistory`, `GetDisplayName`, `SetMasked`/`IsMasked`, `ShowActionBubble`, `SetSpeechDistortion`/`GetSpeechDistortion`, `SetNativeLanguage`, `AddKnownLanguage`, `RemoveKnownLanguage`, `SetSpeakingLanguage`/`GetSpeakingLanguage`, `KnowsLanguage`, `GetKnownLanguages`, `RegisterEmote`.

**Notable events:** `n2-chat:server:reportCreated`, `n2-chat:client:addMessage`, `n2-chat:client:addSuggestions`, `n2-chat:server:createScene`, `n2-chat:client:setScenes`, and the stock-compatible, cancellable `chatMessage(source, name, message)` event for plain proximity chat.

## Notes

:::caution[Load order]
A resource that registers commands through n2-chat's export must start *after* n2-chat (`dependencies { 'n2-chat' }` in its own manifest). This is the #1 troubleshooting item in the README.
:::

:::note
Word filter defaults to `action = 'censor'` (masks and still sends). Switch to `'block'` to reject the whole message instead. The word list ships empty.
:::

:::note
Discord's `chat` webhook category includes private messages - worth flagging to admins before enabling if players expect PM privacy.
:::

:::note
Distance intensity, language unintelligibility, and speech distortion only apply to proximity messages, never to targeted ones (`/w`, `/pm`, `/cw`, `/r`).
:::

Source: `[Native2]/n2-chat/` (README.md, fxmanifest.lua, client/, server/, config/, shared/utils.lua).
