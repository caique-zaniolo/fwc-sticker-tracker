// Bundled starting data so the app works immediately (and after deploy) without
// manually picking files. These are snapshots of the user's CSVs at build time;
// re-import from the Data tab anytime to refresh.
import arthurCsv from "../../data/arthur.csv?raw";
import bernardoCsv from "../../data/bernardo.csv?raw";
import duplicatesCsv from "../../data/duplicates.csv?raw";

export const SEED_CSV: { A: string; B: string; duplicates: string } = {
  A: arthurCsv,
  B: bernardoCsv,
  duplicates: duplicatesCsv,
};
