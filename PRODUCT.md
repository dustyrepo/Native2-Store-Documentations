# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JS (delegated: user asked me to decide; chosen for zero build tooling, opens from any static host or the filesystem directly, easiest to hand off/host alongside the scripts)

## Users

FiveM server owners and developers (specifically the user, running a Qbox-based server) who install, configure, and maintain the "Native2" (`n2-*`) resource pack. They read config.lua files, fxmanifest dependencies, exports, and commands directly.

## Product Purpose

A documentation website for four FiveM scripts in the "Native2" pack:
- **n2-recoil** - weapon recoil control/config script
- **n2-knockout** - knockout/ragdoll system with multi-framework (ESX/QBCore/QBX) bridge support
- **n2-chat** - custom chat resource with scenes, moderation, phone relay, and locale support
- **n2-laptop** - in-game laptop UI bundling banking, crypto (cryptex), mail, black market, item selling, USB/hacking, and whisper/anonymous messaging apps

Success = an admin can install, configure, and troubleshoot each script without opening the source code.

## Positioning

Internal/product documentation, not a marketing site. No competitor claims apply.

## Operating Context

Scripts live under a FiveM server's `resources/[Native2]/` folder. Config is edited via `.lua` files (`config.lua`, `config/*.lua`) and each resource declares dependencies/exports through `fxmanifest.lua`. n2-knockout bridges ESX, QBCore, and QBX frameworks. n2-laptop ships a `.sql` file and an `installation.txt`, implying a database migration step. n2-chat ships a README with existing documentation to source from.

## Capabilities and Constraints

- Source of truth for all documented behavior is the actual script source under `D:\Games\Servers\Qbox\artifact\server\resources\[Native2]\{script}` (mounted at `/mnt/d/Games/Servers/Qbox/artifact/server/resources/[Native2]/` in this environment).
- Static site: no Node/build step required to view.
- Scope is exactly these four scripts. Other `n2-*` folders present in the same directory (n2-damages, n2-housing, n2-hud, n2-mdt, n2-nametags) are explicitly out of scope per the user.

## Evidence on Hand

Real source code for all four scripts (Lua, config files, fxmanifest, README where present). No fabricated screenshots, testimonials, or marketing claims belong on this site - every config key, command, and export documented must trace to source.

## Product Principles

1. Accuracy over polish: every documented config option, command, or export must be verifiable in source.
2. Admin-first structure: install → configure → commands/exports → troubleshooting, per script.
3. Fast scanning: this is reference material read under time pressure, not a persuasive read.
4. One consistent page template across all four scripts so returning readers don't relearn navigation.
