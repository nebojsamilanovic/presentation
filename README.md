# Moonlit — V5.1 interactive prototype (ten scenes)

A creative reset of the presentation. Not an editorial page: three handled
objects, one after another, in one continuous dark space.

1. **Open the gift**: a sealed envelope addressed by hand; the wax breaks, the
   flap lifts, light comes out, the card rises and the words appear.
2. **Our first memory**: a print develops in a darkroom glow; a double-tap
   slides out a note that was tucked behind it.
3. **Turn the photo over**: a print lying on velvet; a tap lifts it, turns it in
   3D, and shows a handwritten dedication on the back.

V5.1 adds scenes 4 to 10 (see **V5.1: scenes 4 to 10** below). Scenes 1 to 3 are
the approved checkpoint `65851de` (`v5-prototype-3-scenes`) and are unchanged.
The V3/V4 project in the folder above is untouched; this prototype lives on the
`v5-creative-prototype` branch.

## Preview

```
python3 -m http.server 8765 --directory ..
```

Open `http://localhost:8765/v5-prototype/index.html`.
Add `?motion=reduce` to see the reduced-motion version without changing system
settings, and `?preview-hour=23` to see the late-night goodnight line.

## Files

| File | Role |
|---|---|
| `index.html` | Structure of the three scenes. No customer text in it |
| `experience.css` | Visual and motion system |
| `experience.js` | Gestures, choreography, rendering of the data |
| `scenes.js` | V5.1: scenes 4 to 10. Registers itself; experience.js creates it |
| `scenes.css` | V5.1: styles of scenes 4 to 10, using the tokens of experience.css |
| `story.js` | Fictional sample data (Ana and Nikola, stock photographs) |
| `tests/test-tone.wav` | A two-second 440 Hz tone generated for the audio test (owned, not music) |

## Visual system

- **Palette:** dark chocolate (`#0f0806` to `#22140f`) for the room, burgundy
  (`#2b0a13` to `#5b1a2b`) for velvet and envelope lining, warm ivory paper
  (`#f7efe1`), soft gold (`#c9a35b`) for small type and lines, candlelight as
  warm radial light (`255 196 128`). Ink is blue-black (`#272035`).
- **Type:** Newsreader (Scanory's serif) for the one line in each scene;
  Instrument Sans (Scanory's sans) for small spaced capitals; Caveat for
  everything written by hand: address, card, caption, note and back of the photo.
- **Materials:** every paper surface carries a fine grain and a soft gradient;
  envelope folds cast small shadows; the lining has a fine gold lattice; the
  print has a real border, a film-camera date stamp and a 3 px edge visible while
  it turns.
- **Composition:** one object per scene, never a heading followed by a
  paragraph. Scene 2 is off-centre (photo left, line right on wide screens);
  scene 3 places its line and hint diagonally around the print.

## Motion system

| Kind | Duration | Easing | Used for |
|---|---|---|---|
| Press | 140 ms | `--ease-press` | The object gives under the finger (envelope, print) |
| Release | 380 ms | `--ease-release` (slight overshoot) | Seal cracking, envelope springing back |
| Lift / turn | 950–1300 ms | `--ease-lift` | Flap opening, card rising, photo turning |
| Settle | 900–1400 ms | `--ease-settle` | Objects arriving and landing |
| Light | 1600–3800 ms | `--ease-light` | Glow, darkroom to warm light, photo developing |

Rule: light never moves faster than objects, and nothing loops except the
candle's slow flicker, the envelope's gentle float before it is opened, and the
thin line under each "next" cue.

**Scene 1 timeline** (from the tap): 0 ms press · 150 ms the wax cracks and the
envelope springs back · 520 ms the flap lifts (the top half of the seal travels
with it) and light spills out · 1180 ms the blank card slides up · 2100 ms the
envelope falls away and the card comes forward · 2900 ms the words appear ·
3800 ms "Come in". About four seconds in all; a second tap skips to the end.

**Scene 2:** when the scene is two-thirds into view the print is placed on the
table (1.4 s), then develops over 3.8 s while the red darkroom light gives way
to warm light; the date stamp and the handwritten caption arrive last.
Double-tap or double-click: each tap draws a ring and nudges the print; the
second within 480 ms slides the note out from behind the photo.

**Scene 3:** the print is laid on the velvet when the scene comes into view.
A tap lifts it toward the viewer, turns it (1.15 s) while its shadow drops away
and a glint crosses the paper, and sets it down again. With a mouse the print
leans slightly toward the pointer.

**Between scenes:** the next scene only exists once the card is out of the
envelope. "Come in" and "One more" scroll smoothly and move focus; the reader
can also simply scroll. As scene 1 leaves the screen its light dims and the card
drifts up. Nothing captures or blocks scrolling: there are only taps, no drags.

**Pauses:** each scene waits for the reader. Nothing advances on a timer except
the 4-second opening and the photo developing.

**Haptics:** a 8–10 ms vibration on a real finger tap where the browser offers
it (Android Chrome). Never on keyboard or mouse, never required.

**Reduced motion** (system setting or `?motion=reduce`): the envelope opens
straight to the card with a short fade; the photo develops as a quick fade with
no movement; the note fades in; the print cross-fades between front and back
with no rotation or lift; no floating, flicker, tilt or vibration.

**If animations fail:** every state is a class, and every class has a finished
CSS state, so when animations or transitions do not run, each tap still lands on
the readable end state. Tested with all animations and transitions forced off.
Without JavaScript the page shows a short notice: the personal text comes from
the data file, so the page needs a script to fill it in. A production version
would render the text on the server.

## Data for the future Studio (`window.SCANORY_V5`)

Presentation and data are separate: `index.html` contains no customer text, and
everything is set with `textContent` (no HTML is ever interpreted). Image
addresses must be `https:`, `http:`, relative, or `data:image/…`; anything else
hides the scene.

| Field | Shown | Default when empty | Suggested limit |
|---|---|---|---|
| `recipient` | Name on the card and back | — | 24 characters |
| `sender` | Signature | — | 24 characters |
| `sample` | "Sample story" notices | No notice | — |
| `scenes.gift.enabled` | Scene 1 | On. Off opens the other scenes directly | — |
| `scenes.gift.address` | On the envelope | "For " + recipient | 24 |
| `scenes.gift.monogram` | In the wax seal | First letter of recipient | 1 |
| `scenes.gift.greeting` | First line of the card | recipient + "," | 30 |
| `scenes.gift.message` | The card | Line hidden | 160 |
| `scenes.gift.signature` | Card and envelope | sender | 24 |
| `scenes.firstMemory.enabled` | Scene 2 | On; off or no image hides it | — |
| `scenes.firstMemory.image`, `imageAlt` | The print | Scene hidden without image | — |
| `scenes.firstMemory.date` | Date line and camera stamp (`YYYY-MM-DD`) | Hidden | — |
| `scenes.firstMemory.dateStamp` | Orange camera stamp | On | — |
| `scenes.firstMemory.caption` | Handwritten on the border | Hidden | 40 |
| `scenes.firstMemory.line` | The scene's line | Hidden | 60 |
| `scenes.firstMemory.thought` | The hidden note | No double-tap, no button | 220 |
| `scenes.photoBack.enabled` | Scene 3 | On; off or no image hides it | — |
| `scenes.photoBack.image`, `imageAlt` | Front of the print | Scene hidden without image | — |
| `scenes.photoBack.line` | The scene's line | Hidden | 40 |
| `scenes.photoBack.greeting` | Back, first line | recipient + "," | 30 |
| `scenes.photoBack.dedication` | Back of the print | Print cannot be turned if greeting and dedication are both empty | 320 |
| `scenes.photoBack.date` | Pencil date on the back (`YYYY-MM-DD`, shown as month and year) | Hidden | — |
| `scenes.photoBack.signature` | Back, last line | sender | 24 |

Handwriting shrinks to fit its paper. Past the suggested limits it can reach
12 px and, at the extreme, the card or back scrolls inside the paper; the Studio
should enforce the limits.

`ScanoryV5.fromV4(story)` maps a saved V3/V4 story onto these fields
(`openingNote`, `originImage`, `origin.date/title/caption/detail`,
`memoryImage`, `memoryNote`) for previewing; `ScanoryV5.render(data)`
re-renders the page.

## Accessibility

- Each gesture is a real button: "Open the envelope", "Read what I never said"
  (beside the photo, for keyboard, switch and screen-reader users), and "Turn
  the photo over / back". Focus is visible on all of them.
- After the envelope opens, focus moves to the card; the cues are links that
  also move focus to the next scene.
- The text on the back is announced when the print is turned; the hidden face is
  `aria-hidden`.
- Double-tap uses `touch-action: manipulation`, so phones do not zoom; nothing
  depends on hover or timing precision (480 ms window, 50 px tolerance).

## Tested (desktop browser pane, emulated sizes)

| Check | Result |
|---|---|
| No horizontal overflow, no clipped text, all scenes opened: 1440, 1024, 768, 390, 320 | PASS |
| Opening choreography, mouse | PASS |
| Second tap skips the opening | PASS |
| Double-click reveals the note; single click says "Once more" | PASS |
| Flip and flip back, mouse | PASS |
| Keyboard only: Tab, Enter, Space through all three scenes | PASS |
| Reduced motion (`?motion=reduce`): no rotation, cross-fades | PASS |
| All animations forced off: every end state reached and readable | PASS |
| Very long names and text at 1024 and 320 | PASS with shrink, ellipsis on the envelope, scrolling as last resort |
| V4 story through `fromV4` | PASS |
| Scene switches, unsafe image address, HTML in text | PASS (scene hidden, text shown literally) |
| Console errors | PASS (none) |
| Real phone touch, real double-tap timing, vibration | NOT TESTED (no device) |
| System reduced-motion setting | NOT TESTED (the `?motion=reduce` switch uses the same code path) |
| Screen reader | NOT TESTED |
| Frame rate on a mobile device | NOT TESTED |

## Known limitations

- Sample photographs are Unsplash stock images loaded at 1400 px; production
  needs responsive sizes for phones.
- The develop effect animates a CSS filter (blur, contrast) on a large image;
  smooth on desktop, unmeasured on older phones.
- Caveat and the two Scanory fonts load from Google Fonts; without them the
  handwriting falls back to the system's script font.
- Static files only: no privacy, no access control.


---

# V5.1: scenes 4 to 10

How they are wired: `scenes.js` registers on `window.SCANORY_V5_SCENES` and is
loaded before `experience.js`. `experience.js` creates it with its helpers and
calls `render`, `unlock`, `fit` and `scroll` at the same moments as for scenes
1 to 3, and merges its V3/V4 adapter into `ScanoryV5.fromV4`. Scenes 4 to 10
stay hidden until the envelope is opened, like scenes 2 and 3. Every listener is
attached once at start-up (by delegation), so re-rendering a story adds none;
re-rendering stops every timer, frame loop, audio element and motion listener.

Continuity: each scene's background begins with the colour the previous one
ends with — burgundy velvet → night sky → lamp-lit table → dark rose → walnut
lamplight → dim frame light → candlelit desk → near-black candle.

## The scenes

| # | Scene | Centrepiece and material | Interaction | Keyboard / single button | Reward |
|---|---|---|---|---|---|
| 4 | Our little universe | Night sky, a still star field (90 fixed points, no loop), one warm star per memory | Scrolling draws the line between stars; tap a star | Stars are buttons; arrow keys, Home, End move between them | The memory: date, title, line, handwritten note. A counter in the sky in words: "4 years, 7 months and 29 days", hours to seconds beneath |
| 5 | Our little archive | A loose pile of real-looking prints under a lamp | Drag or swipe the top print aside; it slides under the pile | Previous and Next buttons; arrow keys on the focused pile | Caption on every print; a paper tab "a note" unfolds a hidden note |
| 6 | Something about you | Dark velvet pad with a faint dotted heart | Draw a heart; a warm luminous trail follows the finger and fades | "Just show me" | Three paper cards with what the sender loves. The drawn heart stays lit |
| 7 | The sound of us | Walnut turntable, vinyl with fixed light reflections, tonearm | Tap the record, or spin it by hand | The record is a button; Play / Pause button when a recording exists | Song title, artist, dedication |
| 8 | The secret I kept | A framed print under dusty glass | Rub the dust away (canvas mask); at 50% the rest clears itself | "Blow the dust away" | The hidden photograph and message |
| 9 | The letter | Burgundy envelope, gold seal, candlelit desk | Tap the envelope: flap opens, the folded letter rises and unfolds into a full page | The envelope is a button | The letter, at reading size on full-width paper, with its P.S. |
| 10 | One last thing | Darkness: "The end." | "Wait. One last thing." Shake the phone (with permission) or tap | "Show me" | A candle lights; the final message, both names, "Read it again". After 23:00 a goodnight line follows |

## Motion (same language as scenes 1 to 3)

- **Universe:** line drawn with scroll position (no timer); stars brighten as the
  line reaches them (900 ms light); selection ring 600 ms `--ease-settle`.
- **Archive:** a dragged print follows the finger with a slight rotation and a
  moving reflection; released past 90 px (or quickly), it flies 55% of the
  screen aside, then slides under the pile in 750 ms `--ease-settle`. Otherwise it
  settles back. Vertical movement is left to page scrolling (`touch-action: pan-y`).
- **Heart:** each segment of the trail fades over 1.8 s; on recognition a warm
  bloom opens behind the pad (1.6 s) and the three cards rise one after another
  (800 ms, 220 ms apart).
- **Turntable:** the platter accelerates to 33⅓ rpm over about a second and slows
  down over about two; the tonearm swings in 1 s `--ease-lift` before the sound
  starts. Spun by hand, the record keeps the speed of the hand and coasts to a stop.
  With no recording the tonearm never moves: nothing pretends to play.
- **Secret:** the brush is soft-edged; the remaining dust fades in 1.1 s.
- **Letter:** flap 900 ms, letter rises 900 ms, then unfolds from a third of its
  height with perspective (1.2 s). Then nothing moves while it is read.
- **Finale:** "The end." fades in; 1.6 s later "Wait. One last thing."; the
  candle lights (1.2 s), the message comes into focus (1.4 s), then names and the
  link. Goodnight line 3.4 s after the reveal, below the link so nothing moves
  under the reader's finger.

Reduced motion: no line drawing (complete at once), no pile movement (cards
fade), no spinning and no tonearm travel, the letter fades open, the finale
fades in; drawing and rubbing still work because they are the reader's own
movement.

## Story data (`window.SCANORY_V5.scenes`) — new in V5.1

All fields optional. Empty fields hide their part; a scene with nothing to show
is hidden. Nothing is ever invented to fill a gap.

| Field | Used for | When empty | Suggested limit |
|---|---|---|---|
| `universe.enabled` | Scene 4 switch | On | — |
| `universe.since` | Counter. ISO date-time with offset, or `YYYY-MM-DD` (local midnight) | No counter. A future or invalid date also hides it | — |
| `universe.line` | Scene line | "Our little universe." | 40 |
| `universe.stars[]` `{date, title, text, note}` | One star each (up to 7) | No constellation; the scene shows the counter alone, or is hidden if there is no date either | date 20, title 40, text 140, note 80 |
| `archive.enabled`, `archive.line` | Scene 5 | On, "Our little archive." | — |
| `archive.photos[]` `{src, alt, caption, note}` | One print each, any number | Scene hidden without photos. One photo: no navigation | caption 50, note 160 |
| `about.enabled`, `about.line`, `about.prompt` | Scene 6 | On, "Draw me a heart.", no prompt | prompt 60 |
| `about.reasons[]` `{title, text}` | Up to three cards | Scene hidden without reasons | title 50, text 180 |
| `song.enabled`, `song.line` | Scene 7 | On, "The sound of us." | — |
| `song.title`, `song.artist`, `song.dedication` | The reveal | Scene hidden without title and dedication | 60, 40, 200 |
| `song.audio` | A recording the customer owns or has licensed (https or relative) | No player at all; "No recording is included here." | — |
| `secret.enabled`, `secret.line`, `secret.image`, `secret.imageAlt`, `secret.message` | Scene 8 | Hidden without image and message; message alone works | message 160 |
| `letter.enabled`, `letter.date`, `letter.body`, `letter.signature`, `letter.postscript` | Scene 9. Paragraphs are separated by a blank line | Hidden without body | body: no fixed limit, it grows as a page |
| `letter.locked` `{label}` | Sealed envelope with the label; the body is not rendered | — | label 60 |
| `finale.enabled`, `finale.message` | Scene 10 | Names only when there is no message | 200 |
| `finale.goodnight` | Shown 23:00–03:59 on the reader's clock, after the reveal | Never shown | 120 |

The recipient and sender names from the top of the story are reused on the
letter envelope and in the finale.

**Migration from V3/V4** (`ScanoryV5.fromV4`): `origin.dateTime` → `universe.since`;
`timeline[]` → stars (`description` → text, `reveal` → note); `gallery[]` → photos
(`bonus` → note); `reasons[]` → reasons; `heart.prompt` → prompt; `song.title`,
`song.note` → dedication, `song.url` → audio; `secretPhoto` → secret;
`letter.message` → body (a V4 letter with `state: 'locked'` becomes `locked`
with its `unlockLabel`, and its text is dropped); `finale.note` → message;
`nightNote` → goodnight. V4 `enabled` switches map to the matching scenes
(`timer` or `timeline` → universe, `gallery`, `reasons`, `song`, `scratch` →
secret, `letter`, `finale`). `chargingNote` is not used: V5.1 does not detect
charging.

**Privacy:** like everything in this prototype, the letter is a public static
file. A real private or date-locked letter must be delivered by a server after
authentication; `letter.locked` here only shows the sealed state.

## V5.1 test report (desktop browser pane, emulated sizes)

| Check | Result |
|---|---|
| Whole journey, every interaction, 1440 / 1024 / 768 / 390 / 320: no horizontal overflow, no clipped personal text | PASS (after fixing the turntable at 1024) |
| Scenes 1–3 against the approved baseline `65851de`: positions, sizes and font sizes of 15 key elements, closed and opened, at 1440 and 390 | PASS (identical) |
| Constellation: line drawn by scroll, star selection by mouse and arrow keys, counter (also 31 January start, future, invalid, missing date) | PASS |
| Archive: mouse drag past threshold, arrows, buttons, note tab, one photo, broken image | PASS |
| Heart: straight line rejected ("Almost"), drawn heart accepted, "Just show me" | PASS (drawn with synthetic pointer events) |
| Turntable: no audio (no player, honest status), owned test tone plays and pauses with tonearm and spin, missing file → "This recording couldn't be played.", unsafe address → no player | PASS |
| Dust: real mouse rubbing clears, threshold reveal, button | PASS |
| Letter: opens into a full page (17–20 px text), focus moves to it; locked letter shows the label and renders no text | PASS |
| Finale: arrival, tap reveal, focus, names, 23:00 goodnight (`?preview-hour=23`) | PASS |
| Shake: gentle motion ignored, two sharp shakes reveal; permission granted and denied paths; tap always works | PASS with simulated motion events and a stubbed permission answer |
| Every scene switched off in turn; names-only story | PASS |
| V2, V3, V4 saved stories through `fromV4` | PASS |
| Very long names and text at 320 | PASS: the letter grows (no inner scroll); envelope names and the record label truncate, the full text is shown elsewhere; long archive notes scroll inside the note |
| Reduced motion (`?motion=reduce`) and keyboard through scenes 4–10 | PASS |
| Ten re-renders: no new listeners except on new images, no timers started | PASS |
| Console | PASS (no messages over a full journey in a fresh tab) |
| Real phone: touch drawing, swiping, rubbing, spinning, real shake and iOS permission | NOT TESTED (no device) |
| Screen reader, system reduced-motion setting, phone frame rate | NOT TESTED |
| Screen recording | NOT DONE (the test browser cannot record) |

## Known limitations (V5.1)

- The heart pad blocks page scrolling when a finger starts inside it (it must,
  to draw); the rest of the scene scrolls normally. Rubbing and spinning only
  capture sideways movement.
- Shake needs motion sensors; on iPhone it needs the permission button first.
  Desktop never shows the shake hint.
- The goodnight line uses the reader's own clock.
- Archive photos are shown at their own proportions between portrait 2:3 and
  landscape 8:5; anything more extreme is cropped around the upper middle,
  where faces usually are.
- Sample photographs are Unsplash images at 1000–1400 px; production needs
  responsive sizes. Total script 67 KB and styles 52 KB uncompressed.
