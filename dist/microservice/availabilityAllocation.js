"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class availabilityAllocation {
    constructor() {
        /**
         * GET the online equipments quantity based on the events registered
         * @param equipments the group of equipments allocated in the front
         * @param events the events of the equipment
         */
        this.getQtdEquipments = async (equipments, events) => {
            console.log("Iniciando debug...");
            let totalEquipments = 0;
            totalEquipments += 1;
            console.log(totalEquipments);
            return totalEquipments;
        };
        this.getAvailability = async (totalMaintenanceTime, equipmentsMaintenance) => {
        };
        this.getTotalMaintenanceTime = async (equipments, events) => {
            /* (Tempo total de manutenção do grupo de equipamentos na frente/ */
            return {
                equipments,
                events
            };
        };
        this.getEquipmentsMaintenance = async () => {
        };
        this.getMedia = async (equipments, events) => {
            let currentDate = new Date();
            return {
                equipments,
                events
            };
        };
        this.getMediaTotal = async (media) => {
            let totalMedia = media;
            return totalMedia;
        };
    }
}
exports.default = availabilityAllocation;
//# sourceMappingURL=availabilityAllocation.js.map