import { StatStages } from "../battle/battleTypes";

/**
 * Delays execution for a specified number of milliseconds.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Applies stat changes to a set of stages and returns the new stages and a log of the changes.
 */
export const applyStatChanges = (
  currentStages: StatStages,
  changes: { stat: string; change: number }[],
  targetName: string,
) => {
  const newStages = { ...currentStages };
  let logs: string[] = [];

  changes.forEach((c) => {
    const statKey = c.stat as keyof StatStages;
    if (newStages[statKey] !== undefined) {
      const oldStage = newStages[statKey];
      newStages[statKey] = Math.max(-6, Math.min(6, oldStage + c.change));

      const currentStage = newStages[statKey];
      const stageSign = currentStage > 0 ? "+" : "";

      if (currentStage === oldStage) {
        logs.push(
          `${targetName.toUpperCase()}'s ${c.stat.toUpperCase()} won't go any higher! (${stageSign}${currentStage})`,
        );
      } else {
        const degree = Math.abs(c.change) >= 2 ? "sharply " : "";
        const direction = c.change > 0 ? "rose" : "fell";
        logs.push(
          `${targetName.toUpperCase()}'s ${c.stat.toUpperCase()} ${degree}${direction}! (${stageSign}${currentStage})`,
        );
      }
    }
  });

  return { newStages, logs };
};
