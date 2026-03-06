const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
    const badIds = ['3', 'A01', 'INV-001', 'INV-002', 'INV-003', 'INV-072'];
    for (const id of badIds) {
        try {
            await p.telemetry.deleteMany({ where: { inverter_id: id } });
            await p.predictions.deleteMany({ where: { inverter_id: id } });
            await p.alerts.deleteMany({ where: { inverter_id: id } });
            await p.maintenance.deleteMany({ where: { inverter_id: id } });
            await p.inverters.delete({ where: { id } });
            console.log('Deleted:', id);
        } catch (e) {
            console.log('Skip:', id, e.message);
        }
    }
    await p.$disconnect();
    console.log('Done');
}

clean();
