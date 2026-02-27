"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var org, apiKey, payload, response, result, task, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    console.log('--- Setting up test API key ---');
                    return [4 /*yield*/, prisma.organization.findFirst({ where: { name: 'n8n Test Org' } })];
                case 1:
                    org = _a.sent();
                    if (!!org) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.organization.create({
                            data: {
                                name: 'n8n Test Org',
                                slug: 'n8n-test-org'
                            }
                        })];
                case 2:
                    org = _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, prisma.apiKey.findFirst({ where: { name: 'n8n_test_key' } })];
                case 4:
                    apiKey = _a.sent();
                    if (!!apiKey) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.apiKey.create({
                            data: {
                                name: 'n8n_test_key',
                                key: 'test_n8n_api_key_12345',
                                organizationId: org.id
                            }
                        })];
                case 5:
                    apiKey = _a.sent();
                    _a.label = 6;
                case 6:
                    console.log('API Key:', apiKey.key);
                    console.log('\n--- Simulating n8n Webhook -> Unified API Request ---');
                    payload = {
                        externalId: "REQ-".concat(Date.now()),
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
                            reference_id: "REF-".concat(Math.floor(Math.random() * 10000))
                        },
                        // The 'Update' representing the long Monday.com description block
                        updateContent: "\uD83D\uDCE5 New Task Submitted\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\uD83D\uDC64 Requester Details\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Name: John Doe\n\u2022 Email: test.requester@example.com\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\uD83D\uDCCC Project Information\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Project Name: Testing Merlin\n\u2022 Selling Points: Great views, nice location\n\u2022 Geo Location: Dubai\n\u2022 Languages: EN, AR\n\u2022 Budget: 50,000 AED\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\uD83D\uDCDD Additional Notes\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nPlease make it look futuristic.\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2699\uFE0F System Info\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Submitted At: ".concat(new Date().toLocaleString()),
                        authorEmail: "test.requester@example.com"
                    };
                    console.log("Payload:", JSON.stringify(payload, null, 2));
                    // Let's call our own local API endpoint running in the docker container 
                    // to test the full stack (Next.js route + DB).
                    console.log('\n--- Sending Request to http://localhost:3000/api/integrations/n8n/unified ---');
                    return [4 /*yield*/, fetch('http://localhost:3000/api/integrations/n8n/unified', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': apiKey.key
                            },
                            body: JSON.stringify(payload)
                        })];
                case 7:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 8:
                    result = _a.sent();
                    console.log('Response Status:', response.status);
                    console.log('Response Body:', result);
                    if (!response.ok) return [3 /*break*/, 10];
                    console.log('\n--- Verifying Database Creation ---');
                    return [4 /*yield*/, prisma.task.findUnique({
                            where: { id: result.taskId },
                            include: { updates: true }
                        })];
                case 9:
                    task = _a.sent();
                    console.log('Created Task Name:', task === null || task === void 0 ? void 0 : task.name);
                    console.log('Created Task Columns:', task === null || task === void 0 ? void 0 : task.columnValues);
                    console.log('Updates Count:', task === null || task === void 0 ? void 0 : task.updates.length);
                    if (task && task.updates.length > 0) {
                        console.log('Update Content Preview:', task.updates[0].content.substring(0, 100) + '...');
                    }
                    _a.label = 10;
                case 10: return [3 /*break*/, 14];
                case 11:
                    error_1 = _a.sent();
                    console.error("Error during test run:", error_1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
run();
