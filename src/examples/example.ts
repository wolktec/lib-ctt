import { createAvailabilityAllocation } from "../index";
import { createPartialDelivered } from "../index";
import mock from '../mock';

createAvailabilityAllocation(mock.equipments, mock.events, '18-12-2024 18:57:56')
  .then(result => {
    console.log("AvailabilityAllocation:", JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error("Erro:", error);
  });

createPartialDelivered(mock.workFronts, mock.realTons, '2023-12-23 15:41:51')
  .then(result => {
    console.log("PartialDelivered:", JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error("Erro:", error);
  });
