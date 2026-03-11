const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInverters() {
    try {
        const inverters = [
            { id: 'INV-01', block: 'Block A', status: 'Active' },
            { id: 'INV-02', block: 'Block A', status: 'Active' },
            { id: 'INV-03', block: 'Block B', status: 'Active' },
            { id: 'INV-04', block: 'Block B', status: 'Active' },
            { id: 'INV-05', block: 'Block C', status: 'Active' },
            { id: 'INV-06', block: 'Block C', status: 'Active' },
            { id: 'INV-07', block: 'Block D', status: 'Active' },
            { id: 'INV-08', block: 'Block D', status: 'Active' }
        ];

        for (const inv of inverters) {
            await prisma.inverters.upsert({
                where: { id: inv.id },
                update: {},
                create: inv
            });

            // Add initial mock telemetry so the dashboard doesn't break
            await prisma.telemetry.create({
                data: {
                    inverter_id: inv.id,
                    power_kw: Math.random() * 50,
                    pv1_power_kw: Math.random() * 25,
                    daily_kwh: Math.random() * 200,
                    inverter_temp_c: 40 + Math.random() * 20,
                    ambient_temp_c: 25 + Math.random() * 10,
                    ac_voltage_v: 230 + Math.random() * 10,
                    dc_voltage_v: 800 + Math.random() * 100,
                    ac_current_a: 10 + Math.random() * 5,
                    dc_current_a: 15 + Math.random() * 5,
                    frequency_hz: 50 + Math.random() * 0.5,
                    alarm_code: 0,
                    op_state: 1,
                    price_per_kwh_inr: 4.5
                }
            });
        }
        console.log("Seeding complete!");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

seedInverters();
