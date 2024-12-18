import availabilityAllocation from './microservice/availabilityAllocation';
import mock from './mock';

const availability = new availabilityAllocation();

availability.getMechanicalAvailability(mock.events, '2')
  .then(result => {
    console.log("Availability:", result);
  })
  .catch(error => {
    console.error("Erro:", error);
  });


  availability.createAvailabilityAllocation(mock.equipments, mock.events)
  .then(result => {
    console.log("Equipments:", JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error("Erro:", error);
  });
