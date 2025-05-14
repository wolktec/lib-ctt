import {
  CttDeliveredReturn,
  CttEstimatedDelivered,
  CttPartialDeliveredResult,
  WorkFrontProductionReturn,
} from "../../interfaces/partialDelivered.interface";

/**
 * GET the partial delivered tons by Front
 * @param workFrontProductionMap - Map of workFront productions received from the API production service.
 */
const createPartialDelivered = async (workFrontProductionMap: Record<number, WorkFrontProductionReturn>): Promise<CttPartialDeliveredResult> => {
  try {
    const formattedDelivered: CttDeliveredReturn[] = 
      Object.entries(workFrontProductionMap)
      .map(([workFrontCode, production]) => ({
        workFrontCode: Number(workFrontCode),
        goal: production.dailyDelivered.goal,
        realTons: production.periodDelivered.total,
        estimatedTons: production.dailyDelivered.total,
        estimatedPerGoal: production.dailyDelivered.progress,
        tonPerHour: production.hourlyDelivered.total,
      }));

    const totalEstimated = formattedDelivered.reduce(
      (acc, item) => acc + item.estimatedTons,
      0
    );
    
    const totalGoal = formattedDelivered.reduce(
      (acc, item) => acc + item.goal,
      0
    );

    const estimated: CttEstimatedDelivered = {
      total: totalEstimated,
      goal: totalGoal,
      progress: (totalEstimated / totalGoal) * 100,
    };

    return {
      delivered: formattedDelivered,
      estimated,
    };
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

export default createPartialDelivered;
