import {
  CttAvailabilityAndAllocation,
  MonitoringCenterAvailability,
} from "../../interfaces/availabilityAllocation.interface";

/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param monitoringCenterAvailability - Response from the monitoring center availability endpoint.
 */
const createAvailabilityAllocation = async (
  monitoringCenterAvailability: MonitoringCenterAvailability
): Promise<CttAvailabilityAndAllocation> => {
  const { goal, groups } = monitoringCenterAvailability;

  const formattedGroupsData = groups.map((groupData) => {
    const { group, workFronts } = groupData;

    const formattedWorkFrontsData = workFronts.map((workFront) => {
      const { workFrontCode, allocated, availability, available, unavailable } =
        workFront;

      return {
        workFrontCode,
        allocated: allocated || 0,
        equipments: (available || 0) + (unavailable || 0),
        unavailable: unavailable || 0,
        availability: availability || 0,
      };
    });

    const totalWorkFronts = workFronts.length;

    const totalAvailability = formattedWorkFrontsData.reduce(
      (acc, workFront) => acc + (workFront.availability || 0),
      0
    );

    const averageAvailability =
      totalWorkFronts > 0 ? totalAvailability / totalWorkFronts : 0;

    return {
      group,
      average: averageAvailability,
      workFronts: formattedWorkFrontsData,
    };
  });

  const cttAvailabilityAndAllocation: CttAvailabilityAndAllocation = {
    groups: formattedGroupsData,
    goal,
  };

  return cttAvailabilityAndAllocation;
};

export default createAvailabilityAllocation;
