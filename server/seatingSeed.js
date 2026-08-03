/**
 * Default venue seating layout matching the Harriett reception floor plan.
 * Coordinates are in SVG space (viewBox 0 0 1600 1200).
 * Only seating tables are seeded — venue shell (rooms, grass, etc.) is drawn in the UI.
 */

function roundTable(label, x, y, seats = 10) {
  return {
    label: String(label),
    kind: 'round',
    x,
    y,
    seats,
    width: 0,
    height: 0,
    locked: false,
    guestIds: Array(seats).fill(null),
  }
}

function rectTable(label, x, y, seats, width, height) {
  return {
    label: String(label),
    kind: 'rect',
    x,
    y,
    seats,
    width,
    height,
    locked: false,
    guestIds: Array(seats).fill(null),
  }
}

/** Numbered reception tables 1–15 + wedding party, placed around the dancefloor. */
export const SEATING_SEED = [
  // Right cluster (from right → left on each row)
  roundTable(1, 1185, 365),
  roundTable(2, 1080, 355),
  roundTable(3, 975, 365),
  roundTable(6, 1185, 495),
  roundTable(7, 1080, 485),
  roundTable(8, 975, 495),
  roundTable(12, 1140, 635),
  roundTable(13, 1020, 635),

  // Left cluster (from left → right on each row)
  roundTable(5, 520, 355),
  roundTable(4, 625, 365),
  roundTable(11, 415, 495),
  roundTable(10, 520, 485),
  roundTable(9, 625, 495),
  roundTable(15, 470, 635),
  roundTable(14, 580, 635),

  // Wedding party — top center, seats along the north edge
  rectTable('WP', 800, 295, 8, 280, 42),

  // Top patio umbrella tables (capacity 4)
  roundTable('U1', 520, 145, 4),
  roundTable('U2', 660, 120, 4),
  roundTable('U3', 800, 110, 4),
  roundTable('U4', 940, 120, 4),
  roundTable('U5', 1080, 145, 4),

  // Left outdoor patio tables (capacity 4)
  roundTable('P1', 95, 360, 4),
  roundTable('P2', 95, 460, 4),
  roundTable('P3', 95, 560, 4),
  roundTable('P4', 95, 660, 4),
  roundTable('P5', 95, 760, 4),
]
