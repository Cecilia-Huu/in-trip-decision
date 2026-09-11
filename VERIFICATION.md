# Progressive Context refinement — 2026-09-11

This is the existing React/Vite GitHub Pages project. No backend, model, reverse-geocoding service, Places API, or private API key was added. The original repository, brand, two tabs, and Lens database remain unchanged.

## Files and responsibilities

- app/progressive-context.tsx: replaces the simultaneously visible context fields with one sentence and conditional location/anchor questions. Handles manual fallback, safe late-callback cancellation, and a two-animation-frame processing transition, with no artificial seconds-long delay. Context stays in memory, not uploaded or persisted.
- app/context-parser.ts: bounded Chinese/English phrase rules extract current location, state, explicit time, dinner/show/train anchors, and explicit no-plan statements. Does not choose AM/PM for an ambiguous “六点”. Anchor destinations are not mistaken for current location. Unknown state uses conservative fallback; no mandatory state questionnaire.
- app/location.ts: calls browser Geolocation only from the user-triggered button; validates coordinates, rejects unsupported/denied/unavailable/timeout outcomes, and returns no invented place name.
- app/decision-engine.ts: retains the existing trade-off strategies and maximum two active steps plus an optional fixed anchor. Adds coordinate-aware search, distinguishes unprovided schedules from explicitly absent schedules, and avoids navigation to a venue that was never supplied.
- app/page.tsx: integrates the progressive input component, passes coordinate search centers into map handoff, and lets repeated “Change the feel” switch between indoor and exploration strategies. Lens business logic is unchanged.
- app/globals.css: adds restrained progressive-question and goose-state styles; 16px inputs, touch-sized buttons, and reduced-motion support.
- public/assets/goose-thinking.svg: original white/charcoal/warm-yellow goose, drawn for this product. No reference image or third-party artwork is copied. Only shown in processing/location failure states, at 88px.
- tests/decision.test.mjs: 16 automated parser, decision, handoff, location-adapter and Lens regression checks.
- package.json: adds npm test, with no new dependencies.
- vite-env.d.ts: Vite asset-base typing for the original Pages subpath.

## Decision behavior

The internal context contains the original change text, currentPlace and/or coordinates, currentTime, optional explicitly stated timeConstraint, optional nextAnchor, noAnchorKnown, currentState, and existing optional preferences. It is deliberately not a general-language model. Time extraction does not imply knowledge of travel time, travel timezone, opening hours, or feasibility of a route.

Fatigue or lower movement tolerance selects rest; continued curiosity selects lightweight exploration; spontaneous/change-the-feel selects an indoor pause; unknown state selects a conservative low-commitment decision. Sleep plus no anchor has a dedicated rest/restart-nearby result. Steering overrides the activity strategy, not the saved location or anchor. Repeated change-the-feel toggles activity categories. Suggestions to rest 30–45 minutes are proposed time allocations, not measured route facts.

Location is asked when no usable current place was parsed. An anchor is asked only when a state-led rest or extra activity could compete with a booking, and no anchor/no-anchor statement was provided. A dirty input with no state can proceed conservatively after location alone. This is a limited heuristic, not semantic understanding of arbitrary prose.

## Map handoff

Step 1 searches an action category near the current manual place. With browser coordinates, Apple Maps uses q + sll; Google Maps receives a category + coordinate search query. Step 2 navigates to the supplied anchor destination. Inputs are URL-encoded, links open in a new tab, and preferredMap is saved locally. Change map remains available. Coordinate-only searches omit Amap rather than assume WGS84/GCJ-02 compatibility; manually named places still offer Amap search. Search results, routes, ETA, availability and booking checks belong to the map provider.

Reference: [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

## Actual verification

- npm test: 16/16 passed. npm run build and npm run lint passed.
- Complete Chinese sentence with Milan, fatigue and 19:00 Navigli: direct result without location/anchor/state confirmation; rest trade-off; two actions plus fixed anchor; one Why module.
- Equivalent complete English sentence: direct English result.
- Dirty input: one location question, no simultaneous full form. Manual-location route verified; conservative result is covered by automated tests.
- Fatigue without place: manual location → optional anchor question → no fixed plan → 90–120 minute result, no state question.
- Adding an anchor manually: 1900 is accepted as 19:00, and Navigli is preserved.
- Hotel + sleep + explicitly no later plans: direct result, two steps, no fabricated anchor.
- Explore, less-walking and repeated change-the-feel: real strategy/step changes in the existing result screen, anchor retained.
- Google Maps Step 1: opened a real cafe search near Milan Cathedral and displayed cafe results. Step 2: opened a new navigation tab for Navigli, Milan without another picker, confirming preference reuse.
- Lens: Milan short/story/detail content switches, Seville and Sagrada results, English switch, unknown-place fallback; supported aliases also covered by automated tests. No Lens data changes.
- 375/390/430px browser viewports: home, result and Lens have no document or inner-screen horizontal overflow. Main CTA clears bottom navigation; textarea is 16px. This is responsive-browser verification, not physical iOS Safari certification.
- English selection persisted across reload. Reload clears in-memory trip context; it does not invent a Seville result.
- Geolocation: no request on opening the page; explicit click entered pending then the genuine error UI with the original goose. The embedded browser's permission layer prevented automated clicks after that failure, so a complete real-permission-failure → manual-entry chain is NOT certified. The ordinary manual-entry path works; unsupported/denied/unavailable/timeout adapter branches and synthetic-coordinate success pass automated tests. Actual device GPS success and native map-app switching still need a device check.
- Loading is intentionally very brief because calculation is local. The processing branch paints before result without a fake AI/network animation; there is no guaranteed multi-second goose display.

## Explicit non-capabilities

No arbitrary natural-language AI reasoning, real POI recommendation, reverse geocoding, live travel time, distance, weather, seat availability, opening hours, verified booking or route optimization is claimed. A supplied event without a venue stays a fixed event without fabricated navigation. Lens remains a finite local database, not camera recognition.
