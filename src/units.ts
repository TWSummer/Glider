// Shared physical scale: a 70-unit storey is 3.5 m, an 11.2-unit wing is 56 cm.
// Flight simulation and saves retain their existing internal coordinates.
export const UNITS_PER_METER = 20;
export const meters = (units: number) => units / UNITS_PER_METER;
export const worldUnits = (meters: number) => meters * UNITS_PER_METER;
export const metricDistance = (units: number) => meters(units) >= 1000 ? `${(meters(units) / 1000).toFixed(2)} km` : `${Math.round(meters(units))} m`;
