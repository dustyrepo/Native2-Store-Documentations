---
title: n2-laptop
description: Setup and full config reference for n2-laptop, a FiveM placeable laptop item with banking, crypto, mail, marketplaces, and USB apps.
---

A placeable laptop item with a full desktop UI: a browser, banking, a fake crypto exchange, mail (including scam templates), two black-market storefronts, peer-to-peer resale, USB file storage, and a private messaging system that also carries in-app NPC conversations.

## Dependencies

- `fx_version 'cerulean'`, `game 'gta5'`, `lua54 'yes'`
- **Hard dependencies:** `ox_lib`, `ox_target`, `ox_inventory`, `oxmysql`.
- **Framework:** auto-detected on resource start, in priority order `qbx_core` → `qb-core` → `es_extended`. If none is running, the resource logs an error and does not function.
- `escrow_ignore { 'config/*.lua' }`.

## Installation

1. Copy the folder to `resources/[Native2]/n2-laptop`.
2. Import `n2-laptop.sql` - every statement is `CREATE TABLE IF NOT EXISTS`, safe to re-run.
3. Add the required `ox_inventory` items: `laptop` (weight 3500, non-stacking, client export `n2-laptop.useLaptop`), `usb_stick` (weight 20, non-stacking), `laptop_hack_device` (weight 150, stackable, consumed on use), plus `pants` / `shirt` / `shoes` / `accessory` as marketplace-deliverable goods. Exact item definitions are in `installation.txt`.
4. Configure `config/config.lua` and `config/marketplaces.lua`.
5. Add `ensure n2-laptop` to `server.cfg`, after `ox_lib`, `ox_target`, `ox_inventory`, and `oxmysql`.

:::caution[Item name mismatch]
`installation.txt` tells you to add an item named `usb_stick`, but `Config.Laptop.usb.item` in `config.lua` defaults to `'usb_device'`. Pick one name and make sure the item and the config key match, or USB features silently won't work.
:::

### Database

| Feature | Tables created |
| --- | --- |
| Whispr | `n2_whispr_accounts`, `n2_whispr_conversations`, `n2_whispr_members`, `n2_whispr_messages`, `n2_whispr_folders`, `n2_whispr_folder_items` |
| Marketplace orders | `n2_market_orders`, `n2_market_order_items` |
| SellHub | `n2_sell_listings`, `n2_sell_reputation` |
| IonBank ledger | `n2_bank_transactions` |

Everything else (placement/ownership, settings, VPN state, bookmarks, notifications, recycle bin, Spotify state) lives in the laptop item's `ox_inventory` metadata - no extra tables needed. Two manual `ALTER TABLE` statements ship as comments in `n2-laptop.sql` for upgrading an existing install (add `haocang_tip_sent` to `n2_sell_reputation`; widen the `status` enum and add `robbery_expires_at` to `n2_sell_listings`) - `CREATE TABLE IF NOT EXISTS` won't apply schema changes to a table that already exists.

## Configuration

### config/config.lua

| Key | Controls |
| --- | --- |
| `Config.Laptop` | `item` (`'laptop'`), `prop` (`prop_laptop_01a`), `openDistance` (1.5), `openControl` (38 = E), `autoLockMinutes` (10, 0 disables). Sub-tables: `usb.item` (`'usb_device'`, see mismatch warning above), `usb.maxFiles` (40); `hack.item` (`'laptop_hack_device'`), `hack.difficulty` (default `easy, easy, medium`), `hack.failCooldownMinutes` (3). |
| `Config.Shop` | Electronics store: `enabled`, location/blip, `items` (laptop $350, usb $50, hack device $500), ped model/scenario. |
| `Config.Spotibeats` | `playlists = {}` - empty by default, entries take a YouTube video id. |
| `Config.Mail` | `templates[]`: id, sender, subject, body, and an optional `scam { amount, payLabel, successBody }`. Ships 4 scam templates (prize, fake job, fake invoice, fake warranty) and 1 harmless newsletter. |
| `Config.BrowserSites` | Array of listed/hidden sites. Ships `darkbay` (placeholder), `cryptex`, `wishbay` / `haocang` (HaoCang requires `requiresVpnLocation = 'cn'`), `sellhub`, `extensionhub`, `ponsonbys`, `ionbank`. |
| `Config.Market` | `defaultItem` (`'accessory'`), `shippingFeePercent` (30), `deliveryMinutes` (1), pickup location, `qualityTiers` keyed off vendor rating (Excellent ≥4.5 down to Poor ≥0). |
| `Config.Sell` | `sellableItems` (pants/shirt/shoes/accessory), offer timing, `maxRounds` (3), `acceptThreshold` (1.05×), `qualityValueMultiplier`, reputation gains/penalties, meetup timing/locations, `robbery.chance` (0.2), `recoveryWindowMinutes` (5), `subduedHealth` (50). |
| `Config.Apps` | App Store / desktop entries (id, name, icon, installed, removable, tagline). Browser, settings, appstore, recycle bin are pre-installed and non-removable; VPN, Whispr, currency, explorer, music, mail are installable. |
| `Config.Extensions` | Browser extensions installable from ExtensionHub. Ships `translator` - adds a translate button and gates readable HaoCang UI when not installed. |
| `Config.WhisprChannels` | `{}` by default - read-only broadcast conversations, posted to via the `PostWhisprChannelMessage` export. |

### config/marketplaces.lua

`Config.Marketplaces`, keyed by id (`wishbay`, `haocang`), each with a `currency`, an accent theme, optional full-UI localization strings (HaoCang ships a complete Chinese set), and a `vendors[]` list. Each vendor has `id, name, rating, reviews, badge?, since, products[]`; each product has `id, name, price, sold, category, color, item, realValue`. The catalog is large by design: 200+ products across 3 WishBay vendors (rating 2.1-4.8) plus 1 HaoCang vendor (4.9), all using invented in-universe brand names, not real trademarks.

## Apps

### Bank (IonBank)

Real bank balance from the framework, plus a genuine transaction ledger in `n2_bank_transactions`, written only through `server/bank.lua`'s charge/deposit wrappers - never touched directly by Market, Sell, or Cryptex. One callback returns balance plus the last 50 transactions; charges elsewhere push a live notification to an open laptop.

### Cryptex

A fake cryptocurrency ("Cryptex Coin" / CTX) with one server-wide price that drifts every 5 minutes (±8% normal move, 5% chance of a larger crash), clamped $5-$500 and persisted via KVP so it survives restarts. Holdings are per-laptop, not per-player. Selling to bank takes a 10% launder fee; selling to cash doesn't.

### Mail

Phishing-style scam emails deliver probabilistically (35% chance per laptop open, minimum 10 minutes apart) from `Config.Mail.templates`. Each scam email's "Pay" button genuinely charges the laptop's bank and delivers nothing back - that's the intended trap, not a bug.

### Market (WishBay / HaoCang)

Browses the `Config.Marketplaces` catalogs. Checkout revalidates price and vendor server-side (never trusts the client), converts non-USD prices via a hardcoded rate table, charges the bank plus a shipping fee, and creates a `pending` order that flips to `ready` after the configured delivery time, with the vendor DMing the buyer over Whispr. Orders are collected later at a physical pickup depot - the laptop doesn't need to be open for that.

### Placement

Client-side ghost-prop placement: raycast from the camera, scroll/arrow keys for reach/height/rotation, <kbd>E</kbd> to confirm, <kbd>Backspace</kbd> to cancel. The server validates, removes the item, spawns a networked prop, and tracks it in memory by net ID. If the resource stops, every placed laptop is handed back to its owner if online, or queued and returned on their next login.

### Sell (SellHub)

Lists a carried clothing item (it stays in the seller's inventory, just tagged) at a player-set price. A synthetic NPC buyer opens negotiation via a real Whispr DM thread, up to `maxRounds` back-and-forth. On acceptance, a meetup is scheduled at a random location; the physical handover has a 20%-default chance the buyer just grabs the item and flees, starting a chase the player has to subdue and search within a recovery window. Reputation only moves on a completed high-quality sale or a declined/expired/unrecovered negotiation; hitting 20 reputation triggers a one-time Whispr tip pointing toward HaoCang.

### USB

Per-item file storage - a USB stick's files live in its own `ox_inventory` metadata, so handing the stick to someone else (or plugging it into a different laptop) carries the same files with it. Capped at `Config.Laptop.usb.maxFiles` (40). The hacking/lock-bypass minigame itself lives in `client/main.lua`, not here.

### Whispr

Private messaging scoped to the laptop item, not the player - a replacement laptop starts with a blank Whispr. Supports DMs, groups with invites, read-only admin broadcast channels, folders, and unread counts. Synthetic identities (`vendor:<marketplace>:<id>`, `buyer:listing:<id>`) let Market and SellHub route their in-character messages through real Whispr conversations. Live delivery only reaches a laptop that's currently open with that conversation; otherwise it's unread on next open.

## Commands

None. Every interaction goes through `ox_target` options (the shop, the laptop prop, the pickup depot, SellHub meetup peds) and NUI callbacks - no `RegisterCommand` calls exist anywhere in this resource.

## Exports / Events

| Export | Description |
| --- | --- |
| `n2-laptop.useLaptop` | Client. Starts the placement flow for a carried laptop item (also wired as the item's own client export in `ox_inventory`). |
| `n2-laptop.GetLaptopHistory` | Server. `(source, laptopId, netId?)` - reads a laptop's stored browser history, e.g. for a "seized laptop" mechanic elsewhere. No permission gating - the caller has to do that itself. |
| `n2-laptop.PostWhisprChannelMessage` | Server. `(channelKey, text)` - posts into an admin-configured Whispr broadcast channel, delivered to every laptop currently open. |

**Key server events:** `n2-laptop:server:registerObject`, `:closeLaptop`, `:powerOff`, `:autoLock`, `:saveState`, `:pickup`, `n2-whispr:sendMessage`, `n2-whispr:markRead`, plus `QBCore:Server:PlayerLoaded` / `esx:playerLoaded` to flush pending laptop give-backs.

**Key client events:** `n2-laptop:client:notify`, `:removeObject`, `n2-laptop:whispr:push`, `:added`, `:conversationDeleted`.

Beyond that, nearly every NUI action has its own `ox_lib` callback (`n2-bank:*`, `n2-cryptex:*`, `n2-mail:*`, `n2-market:*`, `n2-sell:*`, `n2-usb:*`, `n2-whispr:*`, plus placement/passcode/hack callbacks) - too many to list individually here.

## Notes

:::caution[Everything is scoped to the physical laptop item]
Not the player. Losing, selling, or having it stolen loses Whispr history, SellHub listings/reputation, and marketplace orders tied to it - and whoever ends up with it inherits none of the previous owner's data. Deliberate design, but worth telling players.
:::

:::note
Money handling differs by framework: ESX keeps bank/cash in named accounts, QBCore/QBX use `PlayerData.money`. `server/framework.lua` abstracts this - any custom money logic added later needs to follow the same branch.
:::

:::note
The hacking minigame's pass/fail result is entirely client-trusted; the server only enforces item consumption and a per-laptop cooldown after a failure, so it can't be reduced to "buy enough devices and spam it," but it also isn't server-verified.
:::

:::note
Two currency-rate tables (`client/main.lua` and `server/market.lua`) are separately hardcoded and must be kept in sync by hand - there's no shared config for them. Cryptex's name/ticker/launder-fee are similarly duplicated between `client/main.lua`'s NUI payload and a raw constant in `server/cryptex.lua`.
:::

Source: `[Native2]/n2-laptop/` (installation.txt, fxmanifest.lua, config/, client/, server/, n2-laptop.sql).
