"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localTimeZone = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const helper_1 = require("../../helper/helper");
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
exports.localTimeZone = "America/Sao_Paulo";
/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 * @param workFronts logistic work fronts
 */
const createAvailabilityAwaitingTransshipment = async (partialEvents, closureEvents, workFronts) => {
    // Partial
    let groupedEventsByFrontPartial = groupEventsByFront(partialEvents, workFronts);
    let timeAwaitingTransshipmentByFrontPartial = calcAwaitingTransshipmentTime(groupedEventsByFrontPartial);
    let percentageWeightByFrontPartial = calcProgressWeightByFront(timeAwaitingTransshipmentByFrontPartial);
    // Closure
    let groupedEventsByFrontClosure = groupEventsByFront(closureEvents, workFronts);
    let timeAwaitingTransshipmentByFrontClosure = calcAwaitingTransshipmentTime(groupedEventsByFrontClosure);
    let percentageWeightByFrontClosure = calcProgressWeightByFront(timeAwaitingTransshipmentByFrontClosure);
    const formattedValues = formatAvailabilityReturn(timeAwaitingTransshipmentByFrontPartial, percentageWeightByFrontPartial, timeAwaitingTransshipmentByFrontClosure, percentageWeightByFrontClosure);
    return formattedValues;
};
/**
 * GROUP events by equipment FRONT
 * @param events
 * @param workFronts
 */
const groupEventsByFront = (events, workFronts) => {
    let eventsByFront = new Map();
    workFronts.forEach(workFrontCode => {
        const filteredEvents = events.filter(event => event.workFront.code === workFrontCode);
        eventsByFront.set(workFrontCode, filteredEvents);
    });
    return eventsByFront;
};
/**
 * CALC average awaiting transshipment time by FRONT
 * @param eventsByFront
 */
const calcAwaitingTransshipmentTime = (eventsByFront) => {
    const averageByType = new Map();
    let diff = 0;
    for (const [workFrontCode, events] of eventsByFront.entries()) {
        diff = 0;
        console.log(workFrontCode, events.length);
        for (const [_, event] of events.entries()) {
            diff += (0, helper_1.getEventTime)(event);
        }
        const frontTime = averageByType.get(workFrontCode);
        if (!frontTime) {
            averageByType.set(workFrontCode, diff);
        }
        averageByType.set(workFrontCode, diff);
    }
    return averageByType;
};
/**
 * CALC percentage awaiting transshipment time by FRONT
 * @param frontsWithTime
 */
const calcProgressWeightByFront = (frontsWithTime) => {
    const progressByFront = new Map();
    let progress = 0;
    let valueTotal = 0;
    for (const [_, totalSeconds] of frontsWithTime.entries()) {
        valueTotal += totalSeconds;
    }
    for (const [workFrontCode, frontSeconds] of frontsWithTime.entries()) {
        progress = frontSeconds / valueTotal;
        progressByFront.set(workFrontCode, (0, helper_1.normalizeCalc)(progress * 100, 2));
    }
    return progressByFront;
};
/**
 * FORMAT Partial and Closure time and percentage data by TYPE,
 * @param timeAwaitingPartial
 * @param percentageWeightPartial
 * @param timeAwaitingClosure
 * @param percentageWeightClosure
 */
const formatAvailabilityReturn = async (timeAwaitingPartial, percentageWeightPartial, timeAwaitingClosure, percentageWeightClosure) => {
    let partialData = [];
    let closureData = [];
    for (const workFrontCode of timeAwaitingPartial.keys()) {
        // Partial
        const timePartial = timeAwaitingPartial.get(workFrontCode) || 0;
        const progressPartial = percentageWeightPartial.get(workFrontCode) || 0;
        partialData.push({
            workFrontCode,
            time: (0, helper_1.secToTime)(timePartial),
            progress: progressPartial,
        });
        // Closure
        const timeClosure = timeAwaitingClosure.get(workFrontCode) || 0;
        const progressClosure = percentageWeightClosure.get(workFrontCode) || 0;
        closureData.push({
            workFrontCode,
            time: (0, helper_1.secToTime)(timeClosure),
            progress: progressClosure,
        });
    }
    const availabilityResult = {
        partial: partialData,
        closure: closureData,
    };
    return availabilityResult;
};
exports.default = createAvailabilityAwaitingTransshipment;
//# sourceMappingURL=availabilityAwaitingTransshipment.js.map