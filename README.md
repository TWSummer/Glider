# Glider — Small wings. Untold stories.

A browser-based 3D paper-plane adventure inspired by John Calhoun’s *Glider*. Explore the open Willowmere valley, follow local stories, ride rising air, discover equipment, battle paper guardians, and improve your glider. Built with Three.js, TypeScript, and Vite. All world geometry, artwork, effects, and audio are generated locally; Google Fonts has system fallbacks.

## Run

Requires Node.js 22.18 or newer and a WebGL2 browser with hardware acceleration.

```sh
npm install
npm run dev
```

Open the address printed by Vite, normally http://localhost:5173. The repository also supports pnpm using its included lockfile.

```sh
npm run build
npm run preview
npm test
```

## Controls

- **← / →** steer and bank. **↑ / ↓** continuously pitch up and down. WASD also works.
- **Shift** runs the electric fan after you discover it. This uses stored charge.
- **X** shoots rubber bands. Hold to repeat; a small aim assist helps with moving enemies.
- **E** reads nearby signs, talks at field desks, delivers mail and activates mechanisms. The on-screen encounter prompt can also be tapped.
- **U** opens upgrades. **J** opens the atlas, quests, workbench and saves.
- **K** saves. The game also autosaves every 15 seconds, on discoveries and upgrades, and when you switch away or close the page.
- **Space / Escape** pauses or resumes. **Backspace** rescues you to your latest recharge camp without deleting progress.
- **H** opens flight school. **M** toggles sound. **F** toggles fullscreen.
- **Enter** begins or continues from the welcome screen. Touch devices have steering, pitch, fan and shooting buttons.

## Flying

Level, unpowered flight gradually sinks. Diving converts altitude into speed; climbing spends speed. At about **40 m/s or more**, a full loop is practical if there is clear space above and below. Hold pitch-up through the rotation. Attempting a steep climb without enough speed causes a **stall**: control authority falls, the nose drops and the glider sinks until airflow recovers. Releasing pitch gently levels the glider.

Gold particle columns and visible floor grates supply **updrafts**. Each has a real horizontal radius and altitude ceiling. Starter areas have broad, forgiving lift sources. Farther regions add crosswinds, altitude changes, tighter passages and tougher enemies.

Green beacons are **recharge camps**. Flying within their field recharges the fan, repairs the glider and supplies at least 12 rubber bands. They also become rescue checkpoints. Charging takes time; circle back if a single pass does not fill your battery. The fan does not recharge everywhere, and Shift provides no free boost before it is discovered or after the charge runs out.

## An open valley

The field atlas uses terrain-derived coastlines and elevation contours, illustrated landmarks, known recharge camps and a heading-aware player marker. Select a landmark to inspect the region and optionally pin it. Drag to pan, scroll or use +/− to zoom, and use the glider locator or whole-valley button to reset your view. Arrow keys pan when a map landmark has keyboard focus.

Explore freely. The HUD offers broad rumors. The local map shows nearby terrain, vents, contacts and known camps; the journal atlas lists eight regions. You can optionally pin a region or known recharge beacon, or show a chosen quest’s written clue. None of these pins selects a route through the world.

The valley extends from the lake to a storm ridge nearly four kilometers north. Its places share roads, trestle railways, canals and a history:

- **Hearthside:** a grounded, four-storey house with cellar, boiler room, conservatory, study, upstairs library, bedrooms and attic, plus larger garden and school houses.
- **Willow Mill:** a three-storey waterwheel hall, repair workshop, granary and high repair loft.
- **Echo Caverns:** broad crystal chambers, a blue-gallery return loop and an elevated western branch, with continuous rock surfaces at junctions.
- **Coppervein Mine:** a two-storey depot, wide timbered shafts, a pump-room return loop and elevated ore workings.
- **Bellwether City:** harbor streets, market arcade, post office, cargo warehouse, rooftop garden and tall clocktower.
- **Skyheart Temple:** the main sanctuary, terraced approach, garden altar, bell court and archive wing.
- **Sunken Aqueduct:** stone arches, lock house, survey galleries and a northern lantern tower.
- **Starfall Observatory:** the ridge village, scattered lens shelters, summit lookout and great dome.

The valley now has 23 multi-level buildings. Hearthside is 360 × 420 flight units, with floors at 3 / 63 / 133 / 203; each main turning space is sized around the stock glider’s roughly 70-unit turning diameter. Wide doorways, open atriums, perimeter furniture and 14 new exploration caches reward taking side routes and changing floors. Terrain grading and collision share one height function, and Hearthside’s cellar is excavated inside its foundation. Existing save and objective IDs are retained.

There are **13 optional quests**, including recovering field notebooks, assembling a fan, delivering city letters, clearing harbor guardians, restoring mine ventilation, lighting the aqueduct and rebuilding the observatory lens. Use E near a named contact or mechanism. Requests must be accepted; completed requests are turned in to their giver. Found objects and explored landmarks count even if discovered before accepting a request; mail deliveries require first taking Mira’s job. Rewards cannot be claimed twice.

Restoring the mine activates extra ventilation. Restoring the aqueduct brings back two strong updrafts toward the high ridge. The temple sanctuary requires three sigils from the cavern, mine and city, plus visits to both altars. The observatory requires its three scattered lens fragments and the recovered Skyheart. Regions themselves remain open to exploration in any order.

## Equipment and difficulty

The fan is no longer on the initial flight path. Discover Rowan’s bench at Willow Mill, find the housing in the loft, the winding by the waterwheel and the propeller in the highest repair loft, then return to assemble it. Each location can be reached with an unpowered starter glider and local lift.

The portable workbench offers three levels in five upgrade paths:

- **Streamlined folds:** lower drag, more speed, and less loss of ground speed in headwinds.
- **Responsive rudder:** sharper turning, faster pitch response, and less crosswind drift.
- **Long-span wings:** slower natural sink and reduced losses in descending air.
- **High-density cell:** larger finite fan battery.
- **Fan impeller:** greater powered thrust.

Levels cost **20 / 50 / 90 scrap**, with **1 / 2 wind cores** also required for levels II / III. Advanced levels require regional schematics earned through Ada’s, Iona’s, Mira’s, Bram’s and Sela’s quests. Battery and motor upgrades require the fan. Salvage and quest rewards support different equipment choices; ordinary enemy drops no longer bypass the schematic progression.

The mine introduces a cold draft. Aqueduct crossings add headwinds and sinking air; the storm ridge increases both. Better wings and folds reduce those penalties. Camps remain safe places to recharge and repair, while restored ventilation provides useful shortcuts. Guardians become tougher farther out, take one to four hits, and drop persistent loot. Rubber bands are blocked by walls.

## Saving and backups

Saves include flight position and attitude, health, fan charge, ammunition, currencies, upgrades, discovered regions, pickups, defeated guardians, uncollected enemy loot, checkpoint, travel distance, play time, accepted and completed quests, learned schematics, interacted sites, delivered mail and the chosen quest clue.

**Continue your adventure** restores the save. Earlier saves load with existing equipment and discoveries intact; missing quest fields are initialized automatically. Start a new adventure only if you want to replay the revised early progression. **Journal → Save & backup** provides manual save, JSON export and JSON import. Importing requires confirmation before replacing your current adventure. Invalid, truncated and unsupported saves are rejected without changing progress. The previous valid save is retained as a fallback. If browser storage is unavailable, the game reports it and JSON export remains usable.

Browser saves are local to the current origin (including port). They are not cloud saves. Export a backup before clearing browser data, switching browsers/devices, or starting over.

## Code and validation

- `src/flight.ts`: momentum, pitch/loop control, stall recovery, swept projectile collision.
- `src/world.ts`: alpine scenery, instanced forests, water, sky and paper-plane geometry.
- `src/adventure.ts`: physical interiors, lift sources, charging camps, pickups, enemies, projectiles and loot.
- `src/progression.ts`: upgrade economy, finite fan battery, validated saves and fallback storage.
- `src/atlas.ts`: regions, story contacts, terrain shoulders, discoveries and regional winds.
- `src/valley.ts`: grounded settlements, city, mine and gallery geometry, physical tunnel intersections and restored routes.
- `src/quests.ts`: quest acceptance, objectives, deliveries, turn-ins and rewards.
- `src/journal.ts`: the quest interface and journal pages.
- `src/game-map.ts`: terrain contours, cartography, landmark selection and map navigation.
- `src/main.ts`: fixed-step gameplay, chase camera, controls, encounters, HUD and saves.
- `src/*.test.ts`: physics, resource consumption, purchases, save round-trips, corruption recovery, combat, room clearance and exploration simulations.

During development, `/Glider/scene-check.html` inspects the regions and `/Glider/playtest.html?site=millwright&ready=fan` exercises real encounter UI with isolated memory-only progress. Neither modifies player saves, and neither page is included in the production build. The automated tests cover physics, saves and migration, combat, quest requirements, full stock-glider turns with wing clearance in every building and all four Hearthside floors, cave/mine turns and branch connections, terrain-supported foundations, vertical shafts, fan-loft access and a finite-charge expedition to the observatory. Performance mode disables shadows and reduces pixel density.

This is an original homage, not a port. No original game code or assets are included. Reference: https://en.wikipedia.org/wiki/Glider_(video_game).


### Exploration readability

Destinations use distinct architecture families: timber mills, iron-and-glass garden houses, brick depots and warehouses, a striped open market, civic towers, stepped temple cloisters, waterworks and ruined mountain lookouts. Their furnishings match their purpose; the broad turns and open updraft shafts are retained. Echo Caverns has floor- and ceiling-anchored quartz clusters, limestone formations and rock sockets, all registered in the same collision grid as the buildings.

Six enemy silhouettes distinguish paper wasps, echo bats, mine drones, clockwork sentries, temple wardens and storm kites. Hostiles share red eyes. Loot uses recognizable physical objects, with nearby names and a “fly through” label. Interaction signs display E, plus ! for an available request, ? for a turn-in, and a check for a visited location.

Taking a request follows it automatically. The flight hint advances to the next missing objective, while the journal has individual leads, floor/landmark clues and action instructions. Any order is valid; an optional compass pin points only to a region. Quest and collection IDs remain compatible with existing saves. `/visual-check.html` is a development-only object sheet for checking these silhouettes together.
