# 🚁 Helicopter Trivia — 3D Air Combat Quiz Game

[![Deploy to GitHub Pages](https://github.com/adnibog/helicopter-trivia/actions/workflows/deploy.yml/badge.svg)](https://github.com/adnibog/helicopter-trivia/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-v9-black)](https://docs.pmnd.rs/react-three-fiber)

An action-packed 3D tactical flight trivia game built with **React Three Fiber**, **Three.js**, **Rapier Physics**, and **Web Audio API**.

Pilot your attack helicopter through high-speed Alpine mountain canyons, chase down enemy helicopter convoys carrying answer choices, lock on your target with dynamic parabolic trajectory guides, and drop tactical frag grenades to destroy the correct answers!

---

## 🎮 Gameplay & Features

- **🚁 3D Attack Helicopter Flight:** Real military attack helicopter FBX models with forward chase physics, banking maneuvers, rotor blur effects, and engine glow.
- **🎯 3D Target Lock-On & Trajectory Guidance:** Real-time parabolic aiming laser and target bracket `[ 🎯 LOCKED: OPTION X ]` linking the player directly to the locked target.
- **💣 Tactical Frag Grenade (M67 / Pineapple Style):** Realistic 3D segmented fragmentation grenade with safety lever, pull ring, and tumbling ballistic flight physics.
- **💥 Hollywood Fire & Smoke FX:** Multi-stage plasma fireball core, incandescent sparks/embers, billowing black smoke plumes, and crashing fire dives.
- **🏔️ Procedural Alpine Mountain World:** High-speed streaming landscape with canyon rivers, 80+ 3D pine trees, snow-capped distant peaks, and volumetric clouds.
- **🎵 Procedural Cinematic Audio Engine:** Turbine engine hum, crisp launch whooshes, sub-bass explosions, victory chimes, and full mute controls.
- **📱 Responsive Touch & Desktop Controls:** Full keyboard/mouse flight controls alongside dynamic mobile virtual joysticks and portrait orientation guards.
- **⏸️ Smart Auto-Pause:** Automatically pauses gameplay when switching browser tabs or losing window focus.

---

## 🕹️ Controls

| Action | Desktop / Keyboard & Mouse | Mobile / Touch |
| :--- | :--- | :--- |
| **Aim & Lock Target** | Move Mouse or <kbd>A</kbd> / <kbd>D</kbd> | Virtual Joystick Left / Right |
| **Drop Bomb / Grenade** | <kbd>SPACE</kbd> or Left Click | **DROP** Button |
| **Flight Maneuvers** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / Arrows | Virtual Joystick |
| **Altitude Control** | <kbd>SHIFT</kbd> (Up) / <kbd>CTRL</kbd> (Down) | Virtual Joystick Up / Down |
| **Intel Hint** | <kbd>H</kbd> (Costs 50 pts) | HUD Hint Button |
| **Pause Mission** | <kbd>P</kbd> or <kbd>ESC</kbd> | HUD Pause Button |
| **Mute / Unmute** | <kbd>M</kbd> | HUD Mute Button |

---

## 📡 Trivia API Data Format

The game seamlessly accepts trivia questions in raw strings or structured `{ label: string, value: string }` / `{ lable: string, value: string }` objects:

```json
[
  {
    "prompt": {
      "label": "Which planet is known as the Red Planet?",
      "value": "Which planet is known as the Red Planet?"
    },
    "options": [
      { "label": "Venus", "value": "Venus" },
      { "label": "Mars", "value": "Mars" },
      { "label": "Jupiter", "value": "Jupiter" },
      { "label": "Saturn", "value": "Saturn" }
    ],
    "answer": {
      "label": "Mars",
      "value": "Mars"
    },
    "hint": {
      "label": "It is named after the Roman god of war.",
      "value": "It is named after the Roman god of war."
    }
  }
]
```

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler / Dev Server:** Vite 8
- **3D Graphics:** Three.js + React Three Fiber (`@react-three/fiber`)
- **3D Helpers:** `@react-three/drei`
- **Physics Engine:** `@react-three/rapier`
- **Audio:** Web Audio API (Procedural Synthesizers & Soundscapes)
- **Styling:** Vanilla CSS (Glassmorphic Dark Sci-Fi Military HUD)
- **Deployment:** GitHub Pages via GitHub Actions

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/adnibog/helicopter-trivia.git
cd helicopter-trivia
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 🌐 Deployment to GitHub Pages

This project is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Push your code to the `main` or `master` branch.
2. In your GitHub repository settings, go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The deployment will run automatically and host your game live on GitHub Pages!

---

## 📄 License

MIT License. Free for personal and commercial game development.
