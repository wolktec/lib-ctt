"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const index_2 = require("../index");
const mock_1 = __importDefault(require("../mock"));
(0, index_1.createAvailabilityAllocation)(mock_1.default.equipments, mock_1.default.events, '18-12-2024 18:57:56')
    .then(result => {
    console.log("AvailabilityAllocation:", JSON.stringify(result, null, 2));
})
    .catch(error => {
    console.error("Erro:", error);
});
(0, index_2.createPartialDelivered)(mock_1.default.workFronts, mock_1.default.realTons, '2023-12-23 15:41:51')
    .then(result => {
    console.log("PartialDelivered:", JSON.stringify(result, null, 2));
})
    .catch(error => {
    console.error("Erro:", error);
});
//# sourceMappingURL=example.js.map