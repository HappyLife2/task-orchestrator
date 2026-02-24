import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OrbitBoard API | Documentation</title>
    <style>
        :root {
            --primary: #2563eb;
            --primary-light: #eff6ff;
            --success: #10b981;
            --success-light: #ecfdf5;
            --bg: #f8fafc;
            --card: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }

        body {
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        .navbar {
            background: white;
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
        }

        .header {
            margin-bottom: 3rem;
        }

        h1 { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-muted); font-size: 1.125rem; }

        .group-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin: 2.5rem 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .endpoint-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
            transition: all 0.2s;
        }

        .endpoint-header {
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            cursor: pointer;
            background: white;
        }

        .endpoint-header:hover {
            background: #f1f5f9;
        }

        .method {
            font-weight: 800;
            font-size: 0.75rem;
            padding: 4px 12px;
            border-radius: 4px;
            margin-right: 1rem;
            min-width: 60px;
            text-align: center;
            text-transform: uppercase;
        }

        .method.get { background: var(--primary-light); color: var(--primary); }
        .method.post { background: var(--success-light); color: var(--success); }

        .path {
            font-family: 'Fira Code', monospace;
            font-size: 0.9rem;
            font-weight: 600;
            color: #334155;
            flex-grow: 1;
        }

        .summary {
            color: var(--text-muted);
            font-size: 0.875rem;
        }

        .endpoint-details {
            display: none;
            padding: 1.5rem;
            border-top: 1px solid var(--border);
            background: #fafafa;
        }

        .endpoint-card.open .endpoint-details {
            display: block;
        }

        .endpoint-card.open .chevron {
            transform: rotate(90deg);
        }

        .chevron {
            transition: transform 0.2s;
            color: var(--text-muted);
        }

        .section-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
            letter-spacing: 0.05em;
        }

        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            overflow-x: auto;
            margin: 0.5rem 0 1.5rem;
        }

        .property { color: #38bdf8; }
        .string { color: #fbbf24; }
        .comment { color: #94a3b8; }

        .copy-btn {
            background: #f1f5f9;
            border: 1px solid var(--border);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            float: right;
        }

        .copy-btn:hover { background: var(--border); }

        ul { padding-left: 1.25rem; margin-top: 0.5rem; }
        li { margin-bottom: 0.25rem; color: #475569; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="max-width: 1000px; margin: 0 auto; display: flex; align-items: center;">
            <div style="font-weight: 800; font-size: 1.25rem; color: #0f172a;">OrbitBoard API</div>
        </div>
    </div>

    <div class="container">
        <div class="header">
            <span style="color: var(--primary); font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em;">Developer Portal</span>
            <h1>API Documentation</h1>
            <p class="subtitle">Complete guide to automating your task management ecosystem with n8n.</p>
        </div>

        <!-- Orchestration Section -->
        <div class="group-title">Orchestration</div>
        
        <div class="endpoint-card" id="unified-post">
            <div class="endpoint-header" onclick="toggleCard('unified-post')">
                <span class="method post">POST</span>
                <span class="path">/api/n8n/unified</span>
                <span class="summary">Atomic Task Orchestration</span>
                <span class="chevron" style="margin-left: 1rem;">▶</span>
            </div>
            <div class="endpoint-details">
                <p>Creates or updates tasks, auto-configuring boards and groups in a single atomic request.</p>
                
                <div class="section-label">Headers</div>
                <pre>x-api-key: <span class="string">"your-api-key"</span></pre>

                <div class="section-label">Request Body</div>
                <pre>{
  <span class="property">"boardName"</span>: <span class="string">"Development"</span>,
  <span class="property">"groupTitle"</span>: <span class="string">"Sprint 1"</span>,
  <span class="property">"taskName"</span>: <span class="string">"Implement API"</span>,
  <span class="property">"externalId"</span>: <span class="string">"n8n-001"</span>, <span class="comment">// Required for idempotency</span>
  <span class="property">"columnValues"</span>: {
    <span class="property">"status"</span>: <span class="string">"In Progress"</span>
  }
}</pre>

                <div class="section-label">Response (201)</div>
                <pre>{
  <span class="property">"id"</span>: <span class="string">"uuid-123"</span>,
  <span class="property">"action"</span>: <span class="string">"created"</span>,
  <span class="property">"externalId"</span>: <span class="string">"n8n-001"</span>
}</pre>
            </div>
        </div>

        <!-- Messaging Section -->
        <div class="group-title">Messaging</div>

        <div class="endpoint-card" id="updates-post">
            <div class="endpoint-header" onclick="toggleCard('updates-post')">
                <span class="method post">POST</span>
                <span class="path">/api/n8n/updates</span>
                <span class="summary">Post Task Update</span>
                <span class="chevron" style="margin-left: 1rem;">▶</span>
            </div>
            <div class="endpoint-details">
                <p>Add comments or status changes to the activity feed of a task.</p>
                
                <div class="section-label">Request Body</div>
                <pre>{
  <span class="property">"externalId"</span>: <span class="string">"n8n-001"</span>,
  <span class="property">"authorEmail"</span>: <span class="string">"bot@n8n.io"</span>,
  <span class="property">"content"</span>: <span class="string">"&lt;h1&gt;Build Success&lt;/h1&gt;&lt;p&gt;All tests passed.&lt;/p&gt;"</span>
}</pre>
            </div>
        </div>

        <!-- Discovery Section -->
        <div class="group-title">Discovery</div>

        <div class="endpoint-card" id="metadata-get">
            <div class="endpoint-header" onclick="toggleCard('metadata-get')">
                <span class="method get">GET</span>
                <span class="path">/api/n8n/metadata</span>
                <span class="summary">Organization Structure Discovery</span>
                <span class="chevron" style="margin-left: 1rem;">▶</span>
            </div>
            <div class="endpoint-details">
                <p>Retrieves IDs for Boards, Groups, and Status Choices to use in orchestration.</p>
                
                <div class="section-label">Response Schema</div>
                <ul>
                    <li><strong>Departments</strong>: Hierarchical organization</li>
                    <li><strong>Boards</strong>: ID and Column definitions</li>
                    <li><strong>Choice IDs</strong>: Label-to-ID mappings for Status columns</li>
                </ul>
            </div>
        </div>
    </div>

    <script>
        function toggleCard(id) {
            document.getElementById(id).classList.toggle('open');
        }
    </script>
</body>
</html>
    `;
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}
