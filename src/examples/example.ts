import { createAvailabilityAllocation } from "../index";
import mock from '../mock';

createAvailabilityAllocation(mock.equipments, mock.events)
  .then(result => {
    console.log("Equipments:", JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error("Erro:", error);
  });
