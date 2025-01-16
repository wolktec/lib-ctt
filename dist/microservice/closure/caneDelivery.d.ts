import { CttWorkFrontUnit } from "../../interfaces/caneDelivery.interface";
import { CttTon } from "../../interfaces/partialDelivered.interface";
/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param frontsDayProductivity Productivity grouped by front and day
 * @param frontsMonthProductivity Productivity grouped by front and month
 * @param frontsHarvestProductivity Productivity grouped by front and harvest
 * @param workFronts Workfronts with units
 * @param otherUnitDayProductivity Productivity from the other UNIT available grouped by front and day
 * @param otherMonthProductivity Productivity from the other UNIT available by front and month
 * @param otherHarvestProductivity Productivity from the other UNIT available by front and harvest
 * @param date Filtered date
 */
declare const createCaneDelivery: (frontsDayProductivity: CttTon, frontsMonthProductivity: CttTon, frontsHarvestProductivity: CttTon, workFronts: CttWorkFrontUnit[], otherUnitDayProductivity: CttTon, otherMonthProductivity: CttTon, otherHarvestProductivity: CttTon, date: string) => Promise<any>;
export default createCaneDelivery;
