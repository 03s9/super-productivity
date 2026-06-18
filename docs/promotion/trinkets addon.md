---
layout: default
title: 'Trinkets Addon'
permalink: /trinkets-addon/
---

<div align="center">

# 🎲 Trinkets Addon

### For Super Productivity

**Turn your productivity into a collectible pet adventure.**

[![Version](https://img.shields.io/badge/Version-1.1.0-ff7b00?style=for-the-badge&logo=semantic-release)](https://github.com/03s9/super-productivity)
[![Game](https://img.shields.io/badge/App-Super%20Productivity-3b82f6?style=for-the-badge)](https://super-productivity.com)
[![Branch](https://img.shields.io/badge/Branch-mods-22c55e?style=for-the-badge)](https://github.com/03s9/super-productivity/tree/mods)

</div>

---

## 📋 Mod Information

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Author**       | 03s9                                                           |
| **Version**      | 1.1.0                                                          |
| **Category**     | Gameplay / Cosmetics                                           |
| **Branch**       | [`mods`](https://github.com/03s9/super-productivity/tree/mods) |
| **License**      | MIT (mod layer) — respects upstream Super Productivity license |
| **Last Updated** | 18 June 2026                                                   |

---

## 📖 About This Mod

**Trinkets Addon** adds a reward layer on top of Super Productivity. Every time you complete tasks, you earn chances to unlock cute 3D companions, collect coins, and decorate your workspace with draggable pets that float around your screen.

### ✨ Features

- 🏆 **3D Trophy Shelf** — A Three.js shelf showcasing all your unlocked cube-pets.
- 🎁 **Lootbox System** — Earn a lootbox every 5 or 10 tasks completed.
- 🪙 **Coin Economy** — Duplicate trinkets are converted into coins instead of blocking your progress.
- 🐾 **Screen Companions** — Place up to 6 unlocked pets directly on your desktop and drag them anywhere.
- 🎨 **Species Colors** — Each animal has its own color palette pulled from the Kenney atlas.
- 💾 **Persistent Progress** — Everything is saved to `localStorage` with backwards compatibility.
- 🎯 **Featured Companion** — Pin your favorite pet as the main companion.

---

## 🖼️ Screenshots

> _(Screenshots will be added here once the UI is finalized.)_

<div align="center">

|   Trophy Shelf   |  Lootbox Popup   | Desktop Companion |
| :--------------: | :--------------: | :---------------: |
| 🖼️ _Coming soon_ | 🖼️ _Coming soon_ | 🖼️ _Coming soon_  |

</div>

---

## ⚙️ Requirements

- Super Productivity (this fork)
- Node.js `22.18.0` (Volta-pinned)
- Dependencies installed via `npm install` (includes `three` and `@types/three`)

---

## 🚀 Installation

### Option A: Run from source

```bash
git clone https://github.com/03s9/super-productivity.git
cd super-productivity
git checkout mods
npm install
npm start
```

### Option B: Web build

```bash
git checkout mods
npm run buildFrontend:prodWeb
```

Then serve the contents of `.tmp/angular-dist/browser`.

---

## 🎮 How to Use

1. Complete tasks normally.
2. Every 5 or 10 tasks, a **lootbox popup** appears.
3. Open it to unlock a new trinket or earn coins for duplicates.
4. Click the trophy icon to open your **Trophy Shelf**.
5. Click **"Colocar na tela"** to place a pet on your desktop.
6. Drag pets around; hover and click ✕ to remove them.

---

## 📝 Changelog

### v1.1.0 — Trinkets Addon

- Added draggable **Companion Overlay** (up to 6 pets on screen).
- Moved `ANIMAL_COLORS` to shared model for reuse.
- Added "Colocar na tela / Na tela ✓" toggle in Trophy Shelf.
- Persist companion positions in `localStorage`.

### v1.0.0 — Trinkets System

- 24 Kenney Cube Pets in a 3D Trophy Shelf.
- Lootbox every 5/10 tasks with rarity weights.
- Duplicate trinkets grant coins (10/25/50/100).
- Distinct popup state for new vs. duplicate trinkets.
- Coin balance displayed in shelf header.
- "Destacar" button selects the app's featured companion.
- Floating companion widget.

---

## 🙏 Credits

- **03s9** — Mod author
- **Claude Sonnet 4.6** — Pair-programming assistance
- **Super Productivity** by [Johannes Millan](https://github.com/johannesjo) and contributors
- **Kenney** — [Cube Pets](https://kenney.nl/assets/cube-pets) 3D models

---

## ☕ Support

This is a personal fork. If you like the mod, consider supporting the upstream project:

[⭐ Star Super Productivity on GitHub](https://github.com/johannesjo/super-productivity)

---

<div align="center">

**Happy productivity, hero.** 🐾

</div>
