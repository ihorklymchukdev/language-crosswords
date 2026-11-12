# Store listing

App name: **Palabrix** (`DISPLAY_NAME` in `app.config.ts`, shown under the home-screen icon).
Store listings use the longer **Palabrix: Spanish Crosswords** so the app shows up in searches for "spanish crossword".
Bundle id / package: `com.ihorklymchuk.crosswords`. Version: 1.0.0.

## Shared

- Play hi-res icon: `store/play-icon-512.png` (512x512). Play feature graphic: `store/play-feature-graphic.png` (1024x500).

- Support URL: https://ihorklymchukdev.github.io/language-crosswords/support
- Privacy policy URL: https://ihorklymchukdev.github.io/language-crosswords/privacy
- Contact email: ihorklymchuk.dev@gmail.com
- Category: primary Education; secondary Games > Word (App Store) / Education (Play)

## App Store (iOS)

**Name** (30 max): Palabrix: Spanish Crosswords

**Subtitle** (30 max): Daily Spanish mini crosswords

**Promotional text** (170 max):
A fresh Spanish mini crossword every day at your level, plus unlimited themed practice. Works offline, no account, no ads.

**Keywords** (100 max):
vocabulary,learn,language,puzzle,word,game,mini,daily,offline,A2,B1,B2,español,crucigrama,study

**Description** (4000 max):

Learn Spanish vocabulary one small crossword at a time.

Every day there is a new mini crossword at your level: A2 (elementary), B1 (intermediate) or B2 (upper-intermediate). Solve it in a few minutes, or pick a themed practice puzzle (food, travel, home, work and more) and play as many as you like.

- Daily puzzle for each level, the same for everyone on the same date
- Unlimited themed practice puzzles
- Clues are written in Spanish. Tap Translate to see an English version when you need it
- Reveal a letter when you are stuck
- Your streak and finished puzzles are kept on your device
- Works fully offline, on a plane or on the metro
- Light and dark mode

Privacy first: no account, no ads, no tracking, no data collected. Everything stays on your device.

**What's New** (1.0.0):
First release: daily mini crosswords at A2, B1 and B2, unlimited themed practice, letter reveal and English clue translation. Works offline.

### App Privacy ("nutrition label")

Data Not Collected. In App Store Connect answer "No, we do not collect data from this app". No tracking, no third-party SDKs that collect data.

### Export compliance

`ITSAppUsesNonExemptEncryption: false` is set in `app.config.ts`, so no export-compliance prompt per build.

### Age rating questionnaire

All answers None / No:
- Cartoon or fantasy violence, realistic violence, prolonged graphic violence, sexual content or nudity, profanity or crude humor, mature/suggestive themes, horror/fear themes: None
- Alcohol, tobacco, or drug use or references: None
- Simulated gambling, contests: None
- Medical or wellness topics: None
- Advertising: No
- Parental controls: No
- Age assurance: No
- Messaging and chat: No
- Loot boxes: No
- Unrestricted web access: No
- User-generated content / messaging: No
- Result: 4+

## Google Play

**App name** (30 max): Palabrix: Spanish Crosswords

**Short description** (80 max):
Daily mini crosswords to learn Spanish. Offline, no ads, no account.

**Full description** (4000 max):

Learn Spanish vocabulary one small crossword at a time.

Every day there is a new mini crossword at your level: A2 (elementary), B1 (intermediate) or B2 (upper-intermediate). Solve it in a few minutes, or pick a themed practice puzzle (food, travel, home, work and more) and play as many as you like.

- Daily puzzle for each level, the same for everyone on the same date
- Unlimited themed practice puzzles
- Clues are written in Spanish. Tap Translate to see an English version when you need it
- Reveal a letter when you are stuck
- Your streak and finished puzzles are kept on your device
- Works fully offline, on a plane or on the metro
- Light and dark mode

Privacy first: no account, no ads, no tracking, no data collected. Everything stays on your device.

**What's new** (1.0.0):
First release: daily mini crosswords at A2, B1 and B2, unlimited themed practice, letter reveal and English clue translation. Works offline.

### Data safety form

- Does the app collect or share any of the required user data types? **No**
- Is all user data encrypted in transit? Not applicable (no data collected)
- Can users request data deletion? Not applicable (no account, no data leaves the device)
- Account creation: none. Ads: none (declare "No ads").
- Privacy policy URL: see above.

### Content rating (IARC)

Category: Reference, News or Educational (or Game > Puzzle if the questionnaire steers there). All answers No (violence, sexuality, language, controlled substances, gambling, user interaction, location sharing, digital purchases). Expected result: Everyone.

### Other Play declarations

- Target audience: 13+ / general (not designed for children, avoids Families policy requirements)
- Contains ads: No. App access: all functionality available without login.
- Government app / news app / health app / financial features: No.

## Owner checklist

1. Create an Expo account (expo.dev), then `npx eas-cli login`.
2. `npx eas-cli init` (done: `owner` and `extra.eas.projectId` are set in `app.config.ts`).
3. iOS: create the app record in App Store Connect (bundle id `com.ihorklymchuk.crosswords`, name, primary language English (US), SKU), then
   `npx eas-cli build -p ios --profile production` and `npx eas-cli submit -p ios --profile production` (it prompts for the ascAppId and Apple credentials).
   Fill in the listing, privacy label, age rating, screenshots (`store/screenshots/`), and press Submit for Review.
4. Android: create the app in Play Console, fill the listing, data safety and content rating.
   `npx eas-cli build -p android --profile production` produces an AAB. Upload it manually to the first Closed testing release (the first upload must be manual; later ones can use `eas submit` with a service account key).
5. New personal Play developer accounts need a closed test with at least 12 testers opted in for 14 continuous days before applying for production access.
