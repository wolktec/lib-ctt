import { CttAvailabilityAndAllocation, MonitoringCenterAvailability } from "../../interfaces/availabilityAllocation.interface";
/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param monitoringCenterAvailability - Response from the monitoring center availability endpoint.
 */
declare const createAvailabilityAllocation: (monitoringCenterAvailability: MonitoringCenterAvailability) => Promise<CttAvailabilityAndAllocation>;
export default createAvailabilityAllocation;
