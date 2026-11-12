# Store screenshots

Capture from the web build (or a simulator) once the UI is final. 2-8 per store listing.

| Store | Required size | Notes |
|---|---|---|
| App Store, iPhone 6.9" | 1320 x 2868 | Required |
| App Store, iPhone 6.5" | 1284 x 2778 | Optional |
| Google Play, phone | 1080 x 1920 or larger (16:9 to 9:16) | Required |

Suggested shots: one per unique screen, no repeats (a dark-mode copy of a screen counts as a repeat).

Google Play also needs `store/play-icon-512.png` (512 x 512) and `store/play-feature-graphic.png` (1024 x 500), already generated from `assets/icon.svg`.

## Framed set

The upload files (`ios-N.png`, `android-N.png`) are marketing frames: headline, subtitle and a phone frame around the raw capture in `raw/`. Headlines live in `COPY` in `frame.html`. To rebuild after changing copy or replacing a raw capture:

```bash
npm run screenshots:frame   # needs Google Chrome (override with CHROME=/path/to/chrome)
```

## Raw captures (`raw/`)

One shot per unique screen, no repeats. Web dev build in headless Chrome with seeded progress, light mode, iPhone 440x956 @3x and Android 432x768 @2.5x, local date 2026-11-12.

| # | Headline | Screen |
|---|---|---|
| 1 | Learn Spanish with Crosswords | Today: 4-day streak, A2 solved, B1/B2 in progress, Continue practice |
| 2 | Solve Crosswords to Learn Spanish | B1 daily mid-solve, clue translated |
| 3 | Use Clues and Learn Naturally | Clues list sheet over the B1 daily |
| 4 | Build Your Vocabulary | Completion card over the solved A2 daily |
| 5 | Choose a Level and a Theme | Practice picker, B1 and Food selected |
