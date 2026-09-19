# Glider — Small wings. Untold stories.

A browser-based 3D paper-plane adventure inspired by John Calhoun’s *Glider*. Explore the open Willowmere valley, follow local stories, ride rising air, discover equipment, battle paper guardians, and improve your glider. Built with Three.js, TypeScript, and Vite. All world geometry, artwork, effects, and audio are generated locally; Google Fonts has system fallbacks.

## Run

Requires Node.js 22.18 or newer and a WebGL2 browser with hardware acceleration.

```sh
npm install
npm run dev
```

Open the address printed by Vite, normally http://localhost:5173/Glider/. The repository also supports pnpm using its included lockfile.

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
- **L** lands at a marked flight-house bay on approach, or opens services while parked. **B** holds the airbrake; approach below 1.9 m/s.
- **U** shows equipment. Installation requires landing at a workshop. **J** opens the atlas, quests, equipment, cargo manifest and saves. The **Atlas map** button is also available in landing services and the bottom bar.
- **K** saves. The game also autosaves every 15 seconds, on discoveries and upgrades, and when you switch away or close the page.
- **Space / Escape** pauses or resumes. **Backspace** rescues you to your latest emergency camp without deleting progress.
- **H** opens flight school. **M** toggles sound. **F** toggles fullscreen.
- **Enter** begins or continues from the welcome screen. Touch devices have steering, pitch, fan and shooting buttons.

## Flying

All instruments and map scales use one physical scale: 20 simulation units per meter. A typical storey is 3.5 meters high and the glider’s wingspan is about 56 centimeters. Speed, altitude, distances and upgrade descriptions use this same conversion; saved coordinates and flight handling retain their original simulation units.

Level, unpowered flight gradually sinks. Diving converts altitude into speed; climbing spends speed. At about **2 m/s or more**, a full loop is practical if there is clear space above and below. Hold pitch-up through the rotation. Attempting a steep climb without enough speed causes a **stall**: control authority falls, the nose drops and the glider sinks until airflow recovers. Releasing pitch gently levels the glider.

Gold particle columns and visible floor grates supply **updrafts**. Each has a real horizontal radius and altitude ceiling. Starter areas have broad, forgiving lift sources. Farther regions add crosswinds, altitude changes, tighter passages and tougher enemies.

Green beacons mark emergency relaunch checkpoints. For repairs, charging and ammunition, land at an H-marked flight house. Hull repairs and generator charging are complimentary; 12 rubber bands cost 3 scrap. The temple rest has no generator. Shift still provides no free boost before the fan is discovered or after charge runs out.

## An open valley

The field atlas uses terrain-derived coastlines and elevation contours, illustrated landmarks, discovered landings and emergency camps and a heading-aware player marker. Select a landmark to inspect the region and optionally pin it. Drag to pan, scroll or use +/− to zoom, and use the glider locator or whole-valley button to reset your view. Arrow keys pan when a map landmark has keyboard focus.

Explore freely. The HUD offers broad rumors. The local map shows nearby terrain, vents, contacts and known camps; both maps reveal terrain only as you fly nearby. Quest and freight rumors add markers without revealing the surrounding terrain. Unheard-of regions stay hidden. Exploration is saved. You can optionally pin a region or known emergency camp, or show a chosen quest’s written clue. None of these pins selects a route through the world.

The valley extends from the lake to a storm ridge about 200 meters north. Its places share roads, trestle railways, canals and a history. Graded streets have contrasting pavements, each building has a level entrance court, and outdoor furniture is placed only where its full footprint has support. Wider terrain transitions blend these courts back into the landscape:


- **Hearthside:** a grounded, four-storey house with cellar, boiler room, conservatory, study, upstairs library, bedrooms and attic, plus larger garden and school houses.
- **Willow Mill:** a three-storey waterwheel hall, repair workshop, granary and high repair loft.
- **Echo Caverns:** broad crystal chambers, a blue-gallery return loop and an elevated western branch, with continuous rock surfaces at junctions.
- **Coppervein Mine:** a two-storey depot, wide timbered shafts, a pump-room return loop and elevated ore workings.
- **Bellwether City:** harbor streets, market arcade, post office, cargo warehouse, rooftop garden and tall clocktower.
- **Skyheart Temple:** the main sanctuary, terraced approach, garden altar, bell court and archive wing.
- **Sunken Aqueduct:** stone arches, lock house, survey galleries and a northern lantern tower.
- **Starfall Observatory:** the ridge village, scattered lens shelters, summit lookout and great dome.

The valley now has 23 multi-level buildings. Hearthside is 360 × 420 flight units, with floors at 3 / 63 / 133 / 203; each main turning space is sized around the stock glider’s roughly 70-unit turning diameter. Wide doorways, open atriums, perimeter furniture and 14 new exploration caches reward taking side routes and changing floors. Terrain grading and collision share one height function, and Hearthside’s cellar is excavated inside its foundation. Existing save and objective IDs are retained.

There are **15 optional quests**, including recovering field notebooks, assembling a fan, delivering city letters, clearing harbor guardians, restoring mine ventilation, lighting the aqueduct, defeating regional bosses and rebuilding the observatory lens. Use E near a named contact or mechanism. Requests must be accepted; completed requests are turned in to their giver. Found objects and explored landmarks count even if discovered before accepting a request; mail deliveries require first taking Mira’s job. Rewards cannot be claimed twice.

Restoring the mine activates extra ventilation. Restoring the aqueduct brings back two strong updrafts toward the high ridge. The Copper Colossus guards the mine sigil. The temple sanctuary requires three sigils from the cavern, mine and city, visits to both altars, and defeating the Heartwarden. Restoring the observatory requires its three scattered lens fragments, the recovered Skyheart and defeating the Tempest Roc. Regions themselves remain open to exploration in any order.

## Equipment and difficulty

The fan is no longer on the initial flight path. Discover Rowan’s bench at Willow Mill, find the housing in the loft, the winding by the waterwheel and the propeller in the highest repair loft, then return to assemble it. Each location can be reached with an unpowered starter glider and local lift.

Workshops at Hearthside, Willow Mill, Coppervein, the canal yard, the waterworks and Starfall install three levels in eight equipment paths:

- **Streamlined folds:** lower drag, more speed, and less loss of ground speed in headwinds.
- **Responsive rudder:** sharper turning, faster pitch response, and less crosswind drift.
- **Long-span wings:** slower natural sink and reduced losses in descending air.
- **High-density cell:** larger finite fan battery.
- **Fan impeller:** greater powered thrust.
- **Tension launcher:** +1 projectile damage per level.
- **Laminated paper:** 18% less incoming damage per level.
- **Cargo cradle:** +3 slots per level, from an initial 4 to 13.

Levels cost **20 / 50 / 90 scrap**, with **1 / 2 wind cores** also required for levels II / III. Advanced flight-equipment levels require regional schematics earned through Ada’s, Iona’s, Mira’s, Bram’s and Sela’s quests. Launchers, hulls and cargo cradles use currency without a schematic. Battery and motor upgrades require the fan. Salvage and quest rewards support different equipment choices; ordinary enemy drops no longer bypass the schematic progression.

The mine introduces a cold draft. Aqueduct crossings add headwinds and sinking air; the storm ridge increases both. Better wings and folds reduce those penalties. Flight houses provide safe landings for repair and recharge, while restored ventilation provides useful shortcuts. Guardians become tougher farther out, have 2 / 5 / 9 / 14 health by tier, lead their shots in advanced regions, and drop persistent loot. Rubber bands are blocked by walls.

## Flight houses, cargo and trade

Ten existing buildings now contain marked landing bays: Hearthside, the mill, depot, post office, market, canal workshop, temple, lock house, ridge inn and observatory. Approach the open front entrance and press **L**. The glider settles onto a landing table and remains there until **Take off** is selected. Closing a service window leaves the glider parked. Use **Atlas map** to plan a route and **Back to landing services** to return. Takeoff briefly turns the plane toward the doorway, then climbs straight to departure height. Control returns at the top of the climb, with no automatic banking or camera orbit afterward. Departures can be paused; saving or leaving during the animation resumes safely on the original table. Landed games can be saved and resumed.

Markets buy and sell **tea, paper, copper, lens glass and charge cells** at different local prices. Stock is finite, cargo space is enforced, and buying/selling at the same market loses money. Cargo increases sink and drag, making long hauls a flight-planning choice. Eight one-time freight and paper-passenger contracts pay only after landing at the correct destination. One active contract shares capacity with goods. Cargo and unpaid deliveries survive rescues. Destinations can be pinned from the cargo journal.

## Guardians and bosses

Ordinary guardians are tougher farther from home, move within their arenas, and fire faster aimed volleys. Equipment improves damage, durability, maneuverability and range. Living enemies recover when you leave their encounter; docking and rescuing reset active fights.

- **Copper Colossus:** upper western mine workings; unlocks the copper sigil and completes Bram’s boss request.
- **Heartwarden:** central temple atrium; its defeat joins the sigils and altars as a sanctuary requirement.
- **Tempest Roc:** above the observatory dome; required to finish restoring the sky lens and unlock Orin’s passenger contract.

Bosses telegraph orange volleys, then expose a blue cooling core. Fire during that opening. Their HUD shows health and the current attack phase. Boss loot and victories persist in saves.

## Settlement scenery and maps

A shared road network connects every building entrance, with courtyard approaches, rail freight routes, city streets and the high road. It drives both map drawings and tree clearance. Paths follow the terrain, cross water on supported decks, and avoid building footprints. Mature 65–149-unit trees, planted boundaries, benches, freight stacks and street lamps give buildings a surrounding landscape. A continuous mountain range replaces the isolated distant cones.

The new minimap uses shaded terrain, contour lines, roads, building footprints, H landing markers, updrafts, nearby enemies and a distance scale. It shares persistent exploration fog with the Atlas. A rumor reveals only a destination marker, not the terrain around it.

## Saving and backups

Saves include explored map cells, heard rumors, docked location, cargo, local market stock, active freight, completed deliveries, boss victories, flight position and attitude, health, fan charge, ammunition, currencies, upgrades, discovered regions, pickups, defeated guardians, uncollected enemy loot, checkpoint, travel distance, play time, accepted and completed quests, learned schematics, interacted sites, delivered mail and the chosen quest clue.

**Continue your adventure** restores the save. Earlier saves load with existing equipment and discoveries intact; missing quest fields are initialized automatically. Start a new adventure only if you want to replay the revised early progression. **Journal → Save & backup** provides manual save, JSON export and JSON import. Importing requires confirmation before replacing your current adventure. Invalid, truncated and unsupported saves are rejected without changing progress. The previous valid save is retained as a fallback. If browser storage is unavailable, the game reports it and JSON export remains usable.

Browser saves are local to the current origin (including port). They are not cloud saves. Export a backup before clearing browser data, switching browsers/devices, or starting over.

## Code and validation

- `src/flight.ts`: momentum, pitch/loop control, stall recovery, swept projectile collision.
- `src/world.ts`: alpine scenery, instanced forests, water, sky and paper-plane geometry.
- `src/adventure.ts`: physical interiors, lift sources, emergency camps, pickups, enemies, projectiles and loot.
- `src/progression.ts`: upgrade economy, finite fan battery, validated saves and fallback storage.
- `src/atlas.ts`: regions, story contacts, terrain shoulders, discoveries and regional winds.
- `src/valley.ts`: grounded settlements, city, mine and gallery geometry, physical tunnel intersections and restored routes.
- `src/quests.ts`: quest acceptance, objectives, deliveries, turn-ins and rewards.
- `src/journal.ts`: the quest interface and journal pages.
- `src/game-map.ts`: terrain contours, cartography, landmark selection and map navigation.
- `src/settlements.ts` / `src/settlement-scenery.ts`: shared road geometry, mature vegetation, entrance courts and landing bays.
- `src/commerce.ts` / `src/landing.ts`: physical docking, services, finite trade and delivery contracts.
- `src/exploration.ts` / `src/minimap.ts`: persistent exploration and the terrain-based local chart.
- `src/combat.ts`: enemy health, combat equipment and boss encounter definitions.
- `src/main.ts`: fixed-step gameplay, chase camera, controls, encounters, HUD and saves.
- `src/*.test.ts`: physics, resource consumption, purchases, save round-trips, corruption recovery, combat, room clearance and exploration simulations.

During development, `/Glider/scene-check.html` inspects the regions and `/Glider/playtest.html?site=millwright&ready=fan` exercises real encounter UI with isolated memory-only progress. Neither modifies player saves, and neither page is included in the production build. The automated tests cover physics, saves and migration, combat, quest requirements, full stock-glider turns with wing clearance in every building and all four Hearthside floors, cave/mine turns and branch connections, terrain-supported foundations, vertical shafts, fan-loft access and a finite-charge expedition to the observatory. The world-update tests also cover all landing approaches, workshop restrictions, trading, delivery settlement, map discovery, boss shields, saved victories and roads avoiding buildings. Performance mode disables shadows and reduces pixel density.

This is an original homage, not a port. No original game code or assets are included. Reference: https://en.wikipedia.org/wiki/Glider_(video_game).


### Exploration readability

Destinations use distinct architecture families: timber mills, iron-and-glass garden houses, brick depots and warehouses, a striped open market, civic towers, stepped temple cloisters, waterworks and ruined mountain lookouts. Their furnishings match their purpose; the broad turns and open updraft shafts are retained. Echo Caverns has floor- and ceiling-anchored quartz clusters, limestone formations and rock sockets, all registered in the same collision grid as the buildings.

Six enemy silhouettes distinguish paper wasps, echo bats, mine drones, clockwork sentries, temple wardens and storm kites. Hostiles share red eyes. Loot uses recognizable physical objects, with nearby names and a “fly through” label. Interaction signs display E, plus ! for an available request, ? for a turn-in, and a check for a visited location.

Taking a request follows it automatically. The flight hint advances to the next missing objective, while the journal has individual leads, floor/landmark clues and action instructions. Any order is valid; an optional compass pin points only to a region. Quest and collection IDs remain compatible with existing saves. `/visual-check.html` is a development-only object sheet for checking these silhouettes together.
