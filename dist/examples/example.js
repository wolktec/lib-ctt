"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const mock_1 = __importDefault(require("../mock"));
const availability = new index_1.availabilityAllocation();
availability.getMechanicalAvailability(mock_1.default.events, '13:43')
    .then(result => {
    console.log("Availability:", result);
})
    .catch(error => {
    console.error("Erro:", error);
});
availability.createAvailabilityAllocation(mock_1.default.equipments, mock_1.default.events)
    .then(result => {
    console.log("Equipments:", JSON.stringify(result, null, 2));
})
    .catch(error => {
    console.error("Erro:", error);
});
//# sourceMappingURL=example.js.map