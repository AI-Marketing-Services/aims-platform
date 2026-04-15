#!/bin/bash
# Deploy all AI Operator Collective course modules to Mighty Networks
# Usage: bash scripts/deploy-mighty-courses.sh

TOKEN="mn_2448dfad6d2cd083dc4fa1959052e543829fdd71132342bbf34b2f83db3792f8"
NID="23411751"
BASE="https://api.mn.co/admin/v1/networks/$NID"
AUTH="Authorization: Bearer $TOKEN"
SPACE=23411754  # Curriculum & Playbooks (course-enabled)
OVERVIEW=100537791

create_section() {
  local title="$1"
  local parent="$2"
  local result=$(curl -s -X POST "$BASE/spaces/$SPACE/courseworks" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"type\":\"section\",\"parent_id\":$parent,\"title\":\"$title\",\"status\":\"posted\"}")
  echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null
}

create_lesson() {
  local title="$1"
  local parent="$2"
  local desc="$3"
  local result=$(curl -s -X POST "$BASE/spaces/$SPACE/courseworks" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"type\":\"lesson\",\"parent_id\":$parent,\"title\":\"$title\",\"description\":\"$desc\",\"status\":\"posted\",\"completion_criteria\":\"visited\",\"unlocking_criteria\":\"sequential\"}")
  local id=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','FAIL'))" 2>/dev/null)
  echo "  Lesson: $title (ID: $id)"
}

echo "========================================"
echo "  Deploying AI Operator Playbook"
echo "========================================"
echo ""

# ---- MODULE 1 ----
echo ">> Module 1: AI Operator Foundations"
M1=$(create_section "Module 1: AI Operator Foundations" $OVERVIEW)
echo "   Section ID: $M1"
sleep 0.5

M1S1=$(create_section "Getting Started" $M1)
echo "   Sub-section: Getting Started ($M1S1)"
sleep 0.5

create_lesson "What Is an AI Operator?" $M1S1 "<h2>What Is an AI Operator?</h2><p>An AI Operator is a professional who helps businesses implement, optimize, and manage AI tools and workflows. Unlike traditional consultants who deliver reports, AI Operators deliver <strong>results</strong> -- working systems, automated processes, and measurable ROI.</p><p>In this lesson, you will learn:</p><ul><li>The difference between an AI consultant and an AI operator</li><li>Why businesses are willing to pay premium rates for hands-on AI implementation</li><li>The three core skills every AI operator needs</li><li>How to position yourself as the go-to AI expert in your market</li></ul>"
sleep 0.5

create_lesson "Your First 30 Days" $M1S1 "<h2>Your First 30 Days as an AI Operator</h2><p>The first month sets the trajectory for your entire practice. This lesson gives you the exact playbook Ryan and Adam used to go from zero to paying clients.</p><p><strong>Week 1:</strong> Define your niche and ideal client profile</p><p><strong>Week 2:</strong> Build your core offer and pricing structure</p><p><strong>Week 3:</strong> Launch your outreach system</p><p><strong>Week 4:</strong> Close your first engagement</p><p>Each week includes specific tasks, templates, and check-ins to keep you on track.</p>"
sleep 0.5

create_lesson "Choosing Your Niche" $M1S1 "<h2>Choosing Your Niche</h2><p>Generalists compete on price. Specialists compete on value. This lesson walks you through the niche selection framework that ensures you are targeting businesses with real AI budgets and urgent problems.</p><p><strong>The Sweet Spot Framework:</strong></p><ul><li>Industries with high data volume + manual processes</li><li>Businesses doing \$1M-\$50M revenue (big enough to pay, small enough to need you)</li><li>Owners who are tech-curious but time-poor</li></ul><p>We will also cover the niches to <strong>avoid</strong> and why.</p>"
sleep 0.5

M1S2=$(create_section "Mindset and Positioning" $M1)
echo "   Sub-section: Mindset and Positioning ($M1S2)"
sleep 0.5

create_lesson "The Operator Mindset" $M1S2 "<h2>The Operator Mindset</h2><p>The biggest difference between operators who succeed and those who stall is not technical skill -- it is mindset. This lesson covers the mental models that drive consistent results.</p><ul><li><strong>Builder over Advisor:</strong> Ship working systems, not slide decks</li><li><strong>Revenue Focus:</strong> Every project should tie to measurable business outcomes</li><li><strong>Speed Over Perfection:</strong> A working v1 beats a perfect plan every time</li><li><strong>Compound Growth:</strong> Each client makes the next one easier to land</li></ul>"
sleep 0.5

create_lesson "Pricing Your Services" $M1S2 "<h2>Pricing Your Services</h2><p>Most new operators undercharge dramatically. This lesson gives you the pricing framework that positions you as premium from day one.</p><p><strong>Three pricing models:</strong></p><ol><li><strong>Project-Based:</strong> \$2,500-\$15,000 per implementation</li><li><strong>Monthly Retainer:</strong> \$1,500-\$5,000/mo for ongoing optimization</li><li><strong>Value-Based:</strong> Percentage of measurable savings/revenue generated</li></ol><p>Includes real proposals, pricing scripts, and objection handling.</p>"
sleep 0.5

echo ""

# ---- MODULE 2 ----
echo ">> Module 2: Client Acquisition"
M2=$(create_section "Module 2: Client Acquisition" $OVERVIEW)
echo "   Section ID: $M2"
sleep 0.5

M2S1=$(create_section "Finding Clients" $M2)
echo "   Sub-section: Finding Clients ($M2S1)"
sleep 0.5

create_lesson "The Outreach Playbook" $M2S1 "<h2>The Outreach Playbook</h2><p>Cold outreach works when you lead with value. This lesson gives you the exact sequences, templates, and follow-up cadences that consistently generate qualified conversations.</p><ul><li>LinkedIn DM sequences that get 30%+ response rates</li><li>Email templates that bypass the 'we are not interested' reflex</li><li>The Free Audit approach that converts skeptics into clients</li><li>How to use AI tools to personalize outreach at scale</li></ul>"
sleep 0.5

create_lesson "The Discovery Call Framework" $M2S1 "<h2>The Discovery Call Framework</h2><p>A discovery call is not a sales pitch -- it is a diagnostic session. This lesson teaches you the framework that turns exploratory calls into signed proposals.</p><p><strong>The PAIN Framework:</strong></p><ul><li><strong>P</strong>roblem: What is broken or slow?</li><li><strong>A</strong>ttempts: What have they already tried?</li><li><strong>I</strong>mpact: What does this cost them monthly?</li><li><strong>N</strong>ext Steps: What would solving this be worth?</li></ul>"
sleep 0.5

create_lesson "Building Referral Engines" $M2S1 "<h2>Building Referral Engines</h2><p>Your best clients come from your existing clients. This lesson shows you how to systematize referrals so new business flows in without constant outreach.</p><ul><li>When and how to ask for referrals (timing is everything)</li><li>Building strategic partnerships with complementary service providers</li><li>Creating case studies that sell for you</li><li>The Results Review meeting that triggers organic referrals</li></ul>"
sleep 0.5

M2S2=$(create_section "Closing and Onboarding" $M2)
echo "   Sub-section: Closing and Onboarding ($M2S2)"
sleep 0.5

create_lesson "Writing Proposals That Close" $M2S2 "<h2>Writing Proposals That Close</h2><p>Your proposal should be a formality, not a coin flip. This lesson covers the proposal structure that achieves 70%+ close rates.</p><ul><li>The 1-page proposal format (ditch the 20-page deck)</li><li>Anchoring price to business impact, not hours</li><li>Including a 'do nothing' cost to create urgency</li><li>Template library: audit proposals, retainer proposals, project proposals</li></ul>"
sleep 0.5

create_lesson "Client Onboarding System" $M2S2 "<h2>Client Onboarding System</h2><p>The first 48 hours after a client signs determine the entire engagement. This lesson gives you the onboarding system that sets expectations and builds immediate confidence.</p><ul><li>The welcome sequence (email + Loom walkthrough)</li><li>Access and permissions checklist</li><li>Week 1 quick wins to deliver immediate value</li><li>Communication cadence and reporting templates</li></ul>"
sleep 0.5

echo ""

# ---- MODULE 3 ----
echo ">> Module 3: AI Implementation Playbooks"
M3=$(create_section "Module 3: AI Implementation Playbooks" $OVERVIEW)
echo "   Section ID: $M3"
sleep 0.5

M3S1=$(create_section "Core AI Tools" $M3)
echo "   Sub-section: Core AI Tools ($M3S1)"
sleep 0.5

create_lesson "Claude and ChatGPT for Business" $M3S1 "<h2>Claude and ChatGPT for Business</h2><p>LLMs are the foundation of every AI operator's toolkit. This lesson covers how to configure and deploy Claude and ChatGPT for real business use cases.</p><ul><li>When to use Claude vs ChatGPT (strengths of each)</li><li>Building custom instructions for client-specific workflows</li><li>API integration basics for automation</li><li>Cost management and usage optimization</li></ul>"
sleep 0.5

create_lesson "Automation with n8n and Make" $M3S1 "<h2>Automation with n8n and Make</h2><p>The real money in AI operations is in automation. This lesson teaches you to build the workflows that save your clients 20+ hours per week.</p><ul><li>n8n vs Make: when to use which</li><li>The 5 automations every business needs</li><li>Connecting AI models to existing business tools</li><li>Error handling and monitoring for production workflows</li></ul>"
sleep 0.5

create_lesson "AI-Powered CRM and Sales" $M3S1 "<h2>AI-Powered CRM and Sales</h2><p>Help your clients close more deals with AI-enhanced sales systems.</p><ul><li>Lead scoring with AI (which leads are actually hot)</li><li>Automated follow-up sequences that sound human</li><li>Meeting prep bots that research prospects automatically</li><li>Pipeline analytics and forecasting with AI</li></ul>"
sleep 0.5

M3S2=$(create_section "Advanced Implementations" $M3)
echo "   Sub-section: Advanced Implementations ($M3S2)"
sleep 0.5

create_lesson "Custom AI Assistants and Chatbots" $M3S2 "<h2>Custom AI Assistants and Chatbots</h2><p>Build AI assistants that handle customer support, internal Q and A, and process documentation -- saving your clients thousands per month.</p><ul><li>RAG (Retrieval Augmented Generation) explained simply</li><li>Building knowledge bases from existing company docs</li><li>Deploying chatbots on websites and in Slack/Teams</li><li>Measuring ROI: tickets deflected, time saved, CSAT impact</li></ul>"
sleep 0.5

create_lesson "Content and Marketing Automation" $M3S2 "<h2>Content and Marketing Automation</h2><p>AI-powered content systems that produce consistent, on-brand output without burning out your client's marketing team.</p><ul><li>Blog post pipelines: research, outline, draft, edit</li><li>Social media content generation at scale</li><li>Email marketing sequences with AI personalization</li><li>SEO optimization workflows</li></ul>"
sleep 0.5

create_lesson "Data Analysis and Reporting" $M3S2 "<h2>Data Analysis and Reporting</h2><p>Turn your clients' data into actionable insights with AI-powered analysis and automated reporting.</p><ul><li>Building automated dashboards with AI summaries</li><li>Financial analysis and anomaly detection</li><li>Customer behavior pattern recognition</li><li>Generating executive reports that actually get read</li></ul>"
sleep 0.5

echo ""

# ---- MODULE 4 ----
echo ">> Module 4: Scaling Your Practice"
M4=$(create_section "Module 4: Scaling Your Practice" $OVERVIEW)
echo "   Section ID: $M4"
sleep 0.5

M4S1=$(create_section "Systems and Operations" $M4)
echo "   Sub-section: Systems and Operations ($M4S1)"
sleep 0.5

create_lesson "Productizing Your Services" $M4S1 "<h2>Productizing Your Services</h2><p>Stop trading time for money. This lesson shows you how to package your expertise into repeatable, scalable service products.</p><ul><li>The 3-tier service model (Audit, Implementation, Retainer)</li><li>Creating SOPs for every deliverable</li><li>Building templates and frameworks you reuse across clients</li><li>When to raise prices (hint: sooner than you think)</li></ul>"
sleep 0.5

create_lesson "Hiring and Delegation" $M4S1 "<h2>Hiring and Delegation</h2><p>You cannot scale alone. This lesson covers when and how to bring on help -- from VAs to junior operators.</p><ul><li>The first hire to make (it is not who you think)</li><li>Training AI operators: the curriculum that works</li><li>Contractor vs employee: tax and liability considerations</li><li>Tools for managing a distributed team</li></ul>"
sleep 0.5

create_lesson "Financial Management" $M4S1 "<h2>Financial Management for AI Operators</h2><p>Run your practice like a business, not a freelance gig.</p><ul><li>Setting up proper business accounting</li><li>Tax strategy for service businesses</li><li>Cash flow management and invoicing best practices</li><li>When to invest in tools vs when to bootstrap</li></ul>"
sleep 0.5

M4S2=$(create_section "Growth and Authority" $M4)
echo "   Sub-section: Growth and Authority ($M4S2)"
sleep 0.5

create_lesson "Building Your Personal Brand" $M4S2 "<h2>Building Your Personal Brand</h2><p>Your personal brand is your most valuable business asset. This lesson shows you how to build authority that attracts inbound opportunities.</p><ul><li>LinkedIn content strategy that positions you as an expert</li><li>Speaking and workshop opportunities</li><li>Creating case studies that demonstrate clear ROI</li><li>Building an email list of potential clients</li></ul>"
sleep 0.5

create_lesson "From Operator to Agency" $M4S2 "<h2>From Operator to Agency</h2><p>When you are ready, here is the playbook for scaling from solo operator to agency.</p><ul><li>The inflection point: when solo stops making sense</li><li>Building service packages for different market segments</li><li>Creating a sales engine that does not depend on you</li><li>The numbers: margins, utilization, and growth targets</li></ul>"
sleep 0.5

echo ""
echo "========================================"
echo "  DEPLOYMENT COMPLETE"
echo "========================================"
echo ""

# Verify
echo "=== Verification: All coursework items ==="
curl -s "$BASE/spaces/$SPACE/courseworks?per_page=100" -H "$AUTH" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for i in d.get('items',[]):
    indent = '  ' if i.get('parent_type') == 'overview' else '    ' if i.get('type') == 'section' else '      '
    print(f\"{indent}[{i['type']}] {i['title']} (ID: {i['id']}, status: {i['status']})\")
print(f\"\nTotal items: {len(d.get('items',[]))}\")
"
