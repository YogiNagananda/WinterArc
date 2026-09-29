# WINTER ARC ❄️

**A personal discipline tracker for a 90-day self-improvement challenge.**

Built with React, TypeScript, Vite, Tailwind CSS, and IndexedDB. Fully offline, no backend, no login. Installable as a PWA.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production
```bash
npm run build
npm run preview
```

### Run tests
```bash
npm run test
```

---

## ✨ Features

### 📊 Dashboard
- Daily greeting, Day X of 90 counter, progress ring
- Motivational quote (deterministic per day, favorites, refresh)
- Streak, best streak, XP, level with progress bar
- Today's tasks preview and upcoming task countdown

### ✅ Tasks
- Full CRUD with categories (Gym, Study, Health, Work, Personal)
- Priority levels (Low/Medium/High) with XP rewards
- Recurring tasks: daily, weekdays, weekly
- Time-based scheduling with overlap warnings
- Completion tracking per (taskId, date)
- Overdue task highlighting with "move to tomorrow"

### ⏱ Focus Timer
- Timestamp-based timer (survives page refresh, tab throttle, phone sleep)
- Pause/resume/stop with linked task or subject
- XP earned per 25-minute block
- Sound notification + browser Notification API

### 🎯 Daily Goals
- Types: checkbox, counter (with step), time-based
- 8 presets: Water, Study, Steps, Gym, Sleep, Reading, No Junk Food, Meditation
- Auto-reset at day boundary, history preserved

### 🏋️ Gym Tracker
- Log exercises with sets × reps × weight
- Last session reference while logging
- Body weight trend chart (Recharts)
- Workout streak counter

### 📚 Study Tracker
- Subject management with weekly targets
- Session logging with duration
- Weekly hours per subject bar chart

### 🎁 Rewards & Badges
- User-created rewards with XP cost
- Spending XP reduces spendable balance but NOT total XP or level
- 20 achievement badges (streak milestones, level-ups, firsts)
- Redemption history

### 📝 Notes Pad
- Create/edit/delete/pin/search notes
- Checklist items, tags, color labels
- Debounced autosave (~500ms) with "saved" indicator
- Daily journal with mood (1-5)
- Floating quick-note button on every screen

### 📈 Stats & Analytics
- 30-day task completion chart
- 30-day focus hours area chart
- 90-day GitHub-style heatmap
- Category breakdown bars
- Best weekday, total stats

### ⚙️ Settings
- Start date, arc length, day-rollover hour
- Dark/light theme toggle
- Sound and notification toggles
- Export/import JSON backup
- Reset all data with typed confirmation
- Clear sample data button

---

## 🎮 Game Rules

### XP System
| Action | XP |
|--------|-----|
| Low priority task | 10 |
| Medium priority task | 20 |
| High priority task | 30 |
| Completed daily goal | 15 |
| Each 25 min of focus | 10 |
| Perfect Day bonus | 50 |

### Day Success
A day is "successful" when ≥70% of scheduled tasks AND daily goals are completed (with at least 1 item scheduled).

### Streak
- Successful days extend the streak
- **Streak freeze**: 1 per week (resets Monday). Auto-applied with confirmation.
- **Comeback rule**: Missed day shows encouraging "Reset and continue" screen. Best streak preserved.

### Levels
| Level | Min XP |
|-------|--------|
| Rookie | 0 |
| Grinder | 300 |
| Disciplined | 800 |
| Beast | 1,800 |
| Legend | 3,500 |

### Day Boundary
A "day" ends at a configurable rollover hour (default 4 AM). A 1 AM workout counts for the previous day.

---

## 🏗 Tech Stack

- **Frontend**: React 19 + TypeScript (strict mode)
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State**: Zustand
- **Storage**: IndexedDB via `idb`
- **Charts**: Recharts
- **Dates**: date-fns
- **IDs**: nanoid
- **PWA**: vite-plugin-pwa
- **Tests**: Vitest

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (one per route)
├── store/          # Zustand store with IndexedDB persistence
├── db/             # IndexedDB layer
├── hooks/          # Custom React hooks
├── utils/          # Date utilities, helpers
├── types/          # TypeScript type definitions
├── data/           # Quotes, presets, badges
├── rules/          # Game rules engine + tests
```

---

## 📱 PWA & Offline

The app is installable as a Progressive Web App and works offline after first load. Service worker caches all assets.

> **Note**: Browser notifications cannot be guaranteed while the app is fully closed. For best results, keep the app open or install it as a PWA.

---

## 💾 Data Safety

- All data is stored locally in IndexedDB
- `navigator.storage.persist()` is called on first launch
- Schema versioning for future migrations
- Export/import JSON backups
- Soft-delete (archive) preserves history

---

## 🎨 Design

- **Icy winter theme**: Deep navy/black backgrounds, ice-blue accents, frosted-glass cards
- **Dark mode default** with light mode option
- **Mobile-first**: Bottom nav on mobile, sidebar on desktop
- **Micro-animations** with `prefers-reduced-motion` respect
- **Design tokens** via CSS custom properties

---

## 🧪 Testing

```bash
npm run test        # Run all tests once
npm run test:watch  # Watch mode
```

Tests cover:
- XP calculations for all priorities
- Level thresholds and progression
- 70% day success rule
- Perfect day detection
- Streak computation and freeze logic
- Day rollover boundary
- Task scheduling (daily, weekdays, weekly)

---

## 📋 Design Decisions

1. **Dates stored as YYYY-MM-DD local strings** – avoids UTC/timezone issues for day logic
2. **Recurring tasks are templates** – completions stored separately per (taskId, date)
3. **Focus timer uses timestamps** – `startedAt` + `accumulatedMs` pattern survives refresh
4. **Spendable XP vs Total XP** – spending never reduces level
5. **Soft-delete (archived)** – deleting never erases history
6. **No backend** – fully offline, local-first architecture

---

## ⚠️ Known Limitations

1. **Browser notifications** are not guaranteed when the app is closed
2. **No cross-device sync** – data lives only on the current device
3. **PWA icons** need manual generation for production (placeholder paths)
4. **Weekly review** auto-summary is a basic template (not AI-generated)

---

## 📄 License

MIT
