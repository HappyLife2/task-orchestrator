import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('--- Setting up test API key ---');
        // Ensure an organization exists
        let org = await prisma.organization.findFirst({ where: { name: 'n8n Test Org' } });
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: 'n8n Test Org',
                    slug: 'n8n-test-org'
                }
            });
        }

        // Ensure an API key exists
        let apiKey = await prisma.apiKey.findFirst({ where: { name: 'n8n_test_key' } });
        if (!apiKey) {
            apiKey = await prisma.apiKey.create({
                data: {
                    name: 'n8n_test_key',
                    key: 'test_n8n_api_key_12345',
                    organizationId: org.id
                }
            });
        }

        console.log('API Key:', apiKey.key);

        console.log('\n--- Simulating n8n Webhook -> Unified API Request ---');

        // This simulates the data format the compiled n8n workflow will send to us
        const payload = {
            externalId: `REQ-${Date.now()}`,
            name: "New Brochure Design Request",
            department: "Marketing",
            board: "Incoming Requests",
            personEmail: "test.requester@example.com",

            // Standard mapping fields
            status: "To Be Actioned",
            importance: "Medium",
            urgency: "Normal",

            // Simulating parsing of Tally Forms / Webhook data
            customColumns: {
                request_type: "Brochure",
                requester_name: "John Doe",
                reference_id: `REF-${Math.floor(Math.random() * 10000)}`
            },

            // The 'Update' representing the long Monday.com description block
            updateContent: `📥 New Task Submitted

━━━━━━━━━━━━━━━━━━━━
👤 Requester Details
━━━━━━━━━━━━━━━━━━━━
• Name: John Doe
• Email: test.requester@example.com

━━━━━━━━━━━━━━━━━━━━
📌 Project Information
━━━━━━━━━━━━━━━━━━━━
• Project Name: Testing Merlin
• Selling Points: Great views, nice location
• Geo Location: Dubai
• Languages: EN, AR
• Budget: 50,000 AED

━━━━━━━━━━━━━━━━━━━━
📝 Additional Notes
━━━━━━━━━━━━━━━━━━━━
Please make it look futuristic.

━━━━━━━━━━━━━━━━━━━━
⚙️ System Info
━━━━━━━━━━━━━━━━━━━━
• Submitted At: ${new Date().toLocaleString()}`,

            authorEmail: "test.requester@example.com"
        };

        console.log("Payload:", JSON.stringify(payload, null, 2));

        // Let's call our own local API endpoint running in the docker container 
        // to test the full stack (Next.js route + DB).
        console.log('\n--- Sending Request to http://localhost:3000/api/integrations/n8n/unified ---');
        const response = await fetch('http://localhost:3000/api/integrations/n8n/unified', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey.key
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', result);

        if (response.ok) {
            console.log('\n--- Verifying Database Creation ---');
            const task = await prisma.task.findUnique({
                where: { id: result.taskId },
                include: { updates: true }
            });

            console.log('Created Task Name:', task?.name);
            console.log('Created Task Columns:', task?.columnValues);
            console.log('Updates Count:', task?.updates.length);
            if (task && task.updates.length > 0) {
                console.log('Update Content Preview:', task.updates[0].content.substring(0, 100) + '...');
            }
        }

    } catch (error) {
        console.error("Error during test run:", error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
