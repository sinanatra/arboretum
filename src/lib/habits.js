// BG-BASE habit labels (accession HABIT_FULL) grouped into a few readable
// categories for the map filter.
export const HABIT_GROUPS = [
  { key: "tree", label: "Trees", habits: ["tree", "tree - clonal", "dwarf tree"] },
  { key: "shrub", label: "Shrubs", habits: ["shrub", "dwarf shrub", "shrub - clonal", "sub-shrub"] },
  { key: "shrub/tree", label: "Shrubs or trees", habits: ["shrub/tree"] },
  { key: "vine", label: "Vines & climbers", habits: ["vine, climber"] },
  { key: "herb", label: "Herbaceous", habits: ["herbaceous", "grass/sedge", "geophyte", "fern", "rhizomatous"] },
  { key: "unknown", label: "Not recorded", habits: [] },
];

const byHabit = new Map(HABIT_GROUPS.flatMap((g) => g.habits.map((h) => [h, g.key])));

export function habitGroup(habit) {
  // Repaired multi-habit accessions retain every label. Equivalent labels
  // (e.g. shrub; dwarf shrub) belong to the same filter group.
  if (habit?.includes(";")) {
    const groups = new Set(habit.split(";").map((h) => byHabit.get(h.trim()) ?? "unknown"));
    return groups.size === 1 ? [...groups][0] : "unknown";
  }
  return byHabit.get(habit) ?? "unknown";
}
