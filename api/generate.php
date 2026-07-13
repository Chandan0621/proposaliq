<?php
/**
 * ProposalIQ — Secure Gemini API Proxy
 * =====================================
 * Deploy this file to Hostinger inside: /public_html/api/generate.php
 *
 * IMPORTANT: Replace YOUR_GEMINI_API_KEY_HERE with your actual key below.
 * The key stays on the server. No user can see it via Inspect Element.
 */

// ===== APNI API KEY YAHAN DAALEIN =====
define('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY_HERE');
// ======================================

// CORS Headers (allow your domain — change if needed)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Plan, X-User-Email');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get request body
$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['type']) || empty($body['payload'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Type and payload are required']);
    exit;
}

$type    = $body['type'];
$payload = $body['payload'];
$apiKey  = GEMINI_API_KEY;

// Route to correct handler
switch ($type) {
    case 'proposal':
        echo handle_proposal($payload, $apiKey);
        break;
    case 'fiverr':
        echo handle_fiverr($payload, $apiKey);
        break;
    case 'client':
        echo handle_client($payload, $apiKey);
        break;
    case 'followup':
        echo handle_followup($payload, $apiKey);
        break;
    case 'coldemail':
        echo handle_coldemail($payload, $apiKey);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid generation type']);
        break;
}
exit;


// ============================================================
//  GEMINI API CALL (common helper)
// ============================================================
function call_gemini($prompt, $apiKey, $config = []) {
    $model        = $config['model'] ?? 'gemini-2.5-flash';
    $temperature  = $config['temperature'] ?? 0.8;
    $maxTokens    = $config['maxOutputTokens'] ?? 8192;
    $mimeType     = $config['responseMimeType'] ?? null;

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    $genConfig = [
        'temperature'     => $temperature,
        'maxOutputTokens' => $maxTokens,
    ];
    if ($mimeType) {
        $genConfig['responseMimeType'] = $mimeType;
    }

    $data = json_encode([
        'contents'          => [['parts' => [['text' => $prompt]]]],
        'generationConfig'  => $genConfig,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $data,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 60,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return null;
    }

    $decoded = json_decode($response, true);
    return $decoded['candidates'][0]['content']['parts'][0]['text'] ?? null;
}


// ============================================================
//  ROBUST JSON EXTRACTOR
// ============================================================
function extract_json($text) {
    // Try markdown code block first
    if (preg_match('/```(?:json)?\s*([\s\S]*?)```/i', $text, $m)) {
        $candidate = trim($m[1]);
        $parsed = json_decode($candidate, true);
        if ($parsed !== null) return $parsed;
    }
    // Try raw JSON object
    if (preg_match('/\{[\s\S]*\}/', $text, $m)) {
        $parsed = json_decode($m[0], true);
        if ($parsed !== null) return $parsed;
    }
    // Last resort — try full text
    $parsed = json_decode($text, true);
    return $parsed;
}


// ============================================================
//  HANDLER: PROPOSAL GENERATOR
// ============================================================
function handle_proposal($payload, $apiKey) {
    $jobPost  = $payload['jobPost']  ?? '';
    $skill    = $payload['skill']    ?? 'General';
    $exp      = $payload['exp']      ?? 'Intermediate';
    $tone     = $payload['tone']     ?? 'professional';
    $platform = $payload['platform'] ?? 'Upwork';

    $prompt = "You are an expert freelance proposal writer and job analyzer.

=== PROPOSAL WRITING RULES ===
1. First sentence MUST reference the client's specific frustration or explicit request from the job post. NEVER write \"Your project caught my attention\" or \"I came across your posting\".
2. If the client asks for specific things (samples, turnaround time, approach) — address EVERY one directly.
3. No fake claims like \"10+ projects\" or \"20% faster\". Be honest and specific.
4. No bullet points, arrows, emojis, or phase/step timelines.
5. No words: \"excited\", \"thrilled\", \"passionate\", \"ensure\", \"leverage\", \"robust\", \"cutting-edge\", \"streamline\", \"look no further\".
6. If a budget is mentioned, reference it naturally.
7. Keep proposal under 150 words.
8. End with ONE specific question about this project.
9. Write in first-person, confident, conversational tone.

=== JOB DETAILS ===
Job Post: \"\"\"{$jobPost}\"\"\"
Skill: {$skill}
Experience: {$exp}
Tone: {$tone}
Platform: {$platform}

=== OUTPUT ===
Return ONLY this JSON object — no markdown, no explanation:
{\"replyChance\":75,\"clientPersonality\":\"Quality Seeker\",\"urgencyLevel\":\"Medium\",\"urgencyScore\":50,\"budgetSeriousness\":\"Moderate\",\"budgetScore\":60,\"ghostingRisk\":\"Low\",\"ghostScore\":25,\"scamRisk\":\"Low\",\"scamScore\":10,\"copywritingScore\":100,\"pricingConfidence\":70,\"recommendedStrategy\":\"Write 2-3 sentence actionable strategy here.\",\"painPoints\":[\"specific pain point 1\",\"specific pain point 2\",\"specific pain point 3\",\"specific pain point 4\"],\"clientWants\":[\"specific want 1\",\"specific want 2\",\"specific want 3\",\"specific want 4\"],\"thingsToAvoid\":[\"avoid 1\",\"avoid 2\",\"avoid 3\",\"avoid 4\"],\"aiTips\":[\"tip 1\",\"tip 2\",\"tip 3\",\"tip 4\"],\"proposal\":\"Write the full proposal here following the 9 rules above. Under 150 words. End with a question.\"}";

    $raw = call_gemini($prompt, $apiKey, [
        'model'            => 'gemini-2.5-flash',
        'temperature'      => 0.8,
        'maxOutputTokens'  => 8192,
        'responseMimeType' => 'application/json',
    ]);

    if ($raw !== null) {
        $parsed = extract_json($raw);
        if ($parsed) {
            return json_encode(['success' => true, 'source' => 'gemini', 'data' => $parsed]);
        }
        return json_encode(['success' => false, 'error' => 'Response parse failed', 'rawResponse' => substr($raw, 0, 400)]);
    }

    // Simulation fallback
    $data = simulate_proposal($jobPost, $skill, $exp, $tone, $platform);
    return json_encode(['success' => true, 'source' => 'simulation', 'data' => $data]);
}


// ============================================================
//  HANDLER: FIVERR BUYER REQUEST
// ============================================================
function handle_fiverr($payload, $apiKey) {
    $request = $payload['request'] ?? '';
    $gigCat  = $payload['gigCat']  ?? 'General';
    $level   = $payload['level']   ?? 'New Seller';

    $prompt = "You are an expert Fiverr seller. Write a short, compelling reply to this Fiverr buyer request. Make it feel personal, not template-like. Mention their specific needs. Keep it under 120 words. Do not use \"Dear\" or \"To Whom\".

Buyer Request: \"\"\"{$request}\"\"\"
Seller's Gig Category: {$gigCat}
Seller Level: {$level}

Write a reply that:
1. Acknowledges their specific requirement in line 1
2. Briefly mentions relevant experience (1 line)
3. States delivery time and what they'll get
4. Ends with a soft call to action

Output ONLY the reply message, nothing else.";

    $reply = call_gemini($prompt, $apiKey, ['temperature' => 0.75, 'maxOutputTokens' => 400]);

    if ($reply !== null) {
        return json_encode(['success' => true, 'source' => 'gemini', 'reply' => trim($reply)]);
    }

    // Simulation fallback
    $reply = "Hi! I noticed you need {$gigCat} services and I'd love to help.\n\nAs a {$level} seller with hands-on experience in {$gigCat}, I can deliver exactly what you're looking for — clean, professional, and on time.\n\nFeel free to message me so we can discuss the details and get started right away!";
    return json_encode(['success' => true, 'source' => 'simulation', 'reply' => $reply]);
}


// ============================================================
//  HANDLER: CLIENT MESSAGE WRITER
// ============================================================
function handle_client($payload, $apiKey) {
    $msg  = $payload['msg']  ?? '';
    $type = $payload['type'] ?? 'inquiry';
    $tone = $payload['tone'] ?? 'professional';

    $prompt = "You are a professional freelancer. Write a reply to the following client message.
Message Type: {$type}
Tone: {$tone}
Client's Message: \"\"\"{$msg}\"\"\"

Write a reply that:
- Addresses every point the client raised
- Is {$tone} in tone
- Is under 150 words
- Feels human, not robotic or template-like
- Ends with a clear next step

Output ONLY the reply, nothing else.";

    $reply = call_gemini($prompt, $apiKey, ['temperature' => 0.7, 'maxOutputTokens' => 500]);

    if ($reply !== null) {
        return json_encode(['success' => true, 'source' => 'gemini', 'reply' => trim($reply)]);
    }

    // Simulation fallback
    $templates = [
        'inquiry'     => "Hi! Thanks for reaching out.\n\nTo answer your questions: I have hands-on experience with exactly the type of project you've described, and I'm confident in delivering great results within your timeline.\n\nI'd be happy to share relevant samples or jump on a quick call to discuss further. What works best for you?",
        'negotiation' => "Hi! Thanks for your message.\n\nI completely understand budget considerations. While my standard rate reflects the quality and timeline I deliver, I'm open to finding a middle ground.\n\nIf we adjust the scope slightly or extend the deadline, I may be able to accommodate your budget. Let me know your thoughts!",
        'revision'    => "Hi! Absolutely, I want to make sure this is perfect for you.\n\nThank you for the detailed feedback. I'll get started on the revisions right away and send you the updated version within [timeframe].\n\nPlease feel free to share any additional notes!",
        'delay'       => "Hi! Thank you for letting me know in advance.\n\nI understand completely. Take the time you need. I'll keep the project open on my end, and whenever you're ready, just send me a message.\n\nLooking forward to working with you!",
        'complaint'   => "Hi! I sincerely apologize for the experience.\n\nThank you for bringing this to my attention. I want to make this right. Please tell me specifically what didn't meet your expectations and I will fix it as a priority, no questions asked.",
        'positive'    => "Hi! Thank you so much — this genuinely made my day!\n\nIt was a real pleasure working on this project with you. If you ever have future projects, I'd love to work together again!",
    ];
    $reply = $templates[$type] ?? $templates['inquiry'];
    return json_encode(['success' => true, 'source' => 'simulation', 'reply' => $reply]);
}


// ============================================================
//  HANDLER: FOLLOW-UP GENERATOR
// ============================================================
function handle_followup($payload, $apiKey) {
    $context   = $payload['context']   ?? '';
    $followNum = $payload['followNum'] ?? '1st';
    $platform  = $payload['platform']  ?? 'Upwork';

    $prompt = "You are a professional freelancer on {$platform}. Write a {$followNum} follow-up message for the following context.

Context: \"\"\"{$context}\"\"\"

Rules:
- This is a {$followNum} follow-up — match the urgency level accordingly
- Keep it SHORT (under 80 words)
- Do NOT be desperate or pushy
- Remind them of the value you offer in one line
- End with ONE clear, easy call to action
- Sound natural and human

Output ONLY the follow-up message.";

    $reply = call_gemini($prompt, $apiKey, ['temperature' => 0.7, 'maxOutputTokens' => 300]);

    if ($reply !== null) {
        return json_encode(['success' => true, 'source' => 'gemini', 'reply' => trim($reply)]);
    }

    // Simulation fallback
    $msgs = [
        '1st'   => "Hi! I just wanted to follow up on my proposal from a couple of days ago.\n\nI'm still very interested in your project and believe I can deliver exactly what you need. If you have any questions, I'm happy to jump on a quick call.\n\nLooking forward to hearing from you!",
        '2nd'   => "Hi again! I understand you're probably busy — I just wanted to check in one more time before I close out my availability for this week.\n\nIf the project is still moving forward, I'd love to be part of it.\n\nEither way, thanks for your time!",
        'final' => "Hi! This will be my last follow-up — I don't want to clutter your inbox.\n\nIf the timing isn't right, that's completely okay. If you do decide to move forward in the future, I'd still be happy to work together.\n\nWishing you all the best! 🙂",
    ];
    $reply = $msgs[$followNum] ?? $msgs['1st'];
    return json_encode(['success' => true, 'source' => 'simulation', 'reply' => $reply]);
}


// ============================================================
//  HANDLER: COLD EMAIL GENERATOR
// ============================================================
function handle_coldemail($payload, $apiKey) {
    $prospect = $payload['prospect'] ?? '';
    $company  = $payload['company']  ?? '';
    $industry = $payload['industry'] ?? 'SaaS';
    $service  = $payload['service']  ?? '';
    $goal     = $payload['goal']     ?? '';
    $tone     = $payload['tone']     ?? 'Professional';

    $prompt = "You are a world-class cold email copywriter. Generate high-converting cold email content.

Prospect: {$prospect}
Company: {$company}
Industry: {$industry}
Service Offered: {$service}
Goal / Value Prop: {$goal}
Tone: {$tone}

Generate exactly this JSON structure (raw JSON only, no markdown):
{
  \"subjectLines\": [\"subject1\", \"subject2\", \"subject3\", \"subject4\", \"subject5\"],
  \"emailA\": \"full email text here\",
  \"emailB\": \"full email text here (different angle/hook)\",
  \"followup1\": \"first follow-up email (send 3 days later)\",
  \"followup2\": \"second follow-up email (send 7 days later, final)\",
  \"linkedin\": \"linkedin connection request or DM message (max 300 chars)\"
}

Rules for ALL emails:
- Never start with \"I hope this email finds you well\"
- Open with a strong hook referencing {$company} or {$industry}
- Focus on THEIR problem, not your service
- Keep emails under 120 words each
- Tone: {$tone}
- Strong, specific CTA at the end of each email";

    $raw = call_gemini($prompt, $apiKey, ['temperature' => 0.8, 'maxOutputTokens' => 2000]);

    if ($raw !== null) {
        $parsed = extract_json($raw);
        if ($parsed) {
            return json_encode(['success' => true, 'source' => 'gemini', 'data' => $parsed]);
        }
    }

    // Simulation fallback
    $data = [
        'subjectLines' => [
            "Quick question about {$company}'s " . strtolower($service) . " strategy",
            "How {$industry} companies are getting better results with {$service}",
            "{$prospect}, saw something interesting about {$company}",
            "The " . strtolower($service) . " gap most {$industry} companies don't see",
            "15 min call? This could be useful for {$company}",
        ],
        'emailA'    => "I was looking at {$company}'s recent work in the {$industry} space — and noticed an opportunity most companies miss.\n\nWe help businesses like {$company} {$goal}.\n\nWould you be open to a 15-minute call this week?\n\nBest,\n[Your Name]",
        'emailB'    => "{$prospect},\n\nMost {$industry} companies struggle with " . strtolower($service) . " — not because of effort, but because of approach.\n\nI'd love to show you what we did for a similar company.\n\nCan we talk Thursday or Friday for 15 minutes?\n\n[Your Name]",
        'followup1' => "Hi {$prospect},\n\nJust following up on my last note. {$company} seems like a great fit for what we do.\n\nHappy to share a quick case study if helpful. Would you be open to a brief call?\n\n[Your Name]",
        'followup2' => "Hi {$prospect},\n\nI'll keep this brief — last follow-up, I promise.\n\nIf " . strtolower($service) . " isn't a priority right now, no worries. But if it ever becomes one, I'd love to be your first call.\n\nWishing you and {$company} the best! 🙂",
        'linkedin'  => "Hi {$prospect}! I help {$industry} companies {$goal}. Thought there might be a fit with {$company}. Would love to connect!",
    ];
    return json_encode(['success' => true, 'source' => 'simulation', 'data' => $data]);
}


// ============================================================
//  PROPOSAL SIMULATION (fallback when Gemini unavailable)
// ============================================================
function simulate_proposal($jobPost, $skill, $exp, $tone, $platform) {
    $t = strtolower($jobPost);

    $urgencyScore = (strpos($t,'asap')!==false || strpos($t,'urgent')!==false || strpos($t,'immediately')!==false) ? 88
        : ((strpos($t,'soon')!==false || strpos($t,'quickly')!==false) ? 65 : rand(20,50));
    $budgetScore  = (strpos($t,'$')!==false || strpos($t,'budget')!==false || strpos($t,'pay')!==false) ? rand(70,90) : rand(40,65);
    $scamScore    = (strpos($t,'gift card')!==false || strpos($t,'wire transfer')!==false) ? 92
        : ((strpos($t,'verified')!==false || strpos($t,'payment protected')!==false) ? 6 : rand(5,23));
    $ghostScore   = $urgencyScore > 70 ? rand(10,25) : ($budgetScore < 50 ? rand(50,70) : rand(20,45));
    $replyChance  = min(95, max(35, round(100 - $ghostScore*0.3 - $scamScore*0.15 + $budgetScore*0.3 + $urgencyScore*0.1 + rand(0,10))));
    $pricingConf  = $budgetScore > 60 ? rand(70,85) : rand(45,65);
    $trustScore   = max(5, round(100 - $scamScore - rand(0,5)));

    $personalities = ['Detail-Oriented','Fast-Paced Executor','Budget-Conscious','Quality Seeker','Visionary Builder','Collaborative Partner','Results-Driven'];
    $strategies    = [
        "Lead with a specific result you've achieved before. Show you understand their exact problem in the first line. End with one smart, project-specific question.",
        "Open with the client's biggest challenge. Propose a clear solution, mention your relevant experience, and invite a quick discovery call.",
        "Be direct and confident — state what you'll deliver and when. Clients on {$platform} respond well to clarity over flattery.",
    ];

    return [
        'replyChance'          => $replyChance,
        'clientPersonality'    => $personalities[array_rand($personalities)],
        'urgencyLevel'         => $urgencyScore > 70 ? 'High' : ($urgencyScore > 40 ? 'Medium' : 'Low'),
        'urgencyScore'         => $urgencyScore,
        'budgetSeriousness'    => $budgetScore > 70 ? 'Serious' : ($budgetScore > 40 ? 'Moderate' : 'Unclear'),
        'budgetScore'          => $budgetScore,
        'ghostingRisk'         => $ghostScore > 60 ? 'High' : ($ghostScore > 35 ? 'Medium' : 'Low'),
        'ghostScore'           => $ghostScore,
        'scamRisk'             => $scamScore > 70 ? 'High' : ($scamScore > 40 ? 'Medium' : 'Low'),
        'scamScore'            => $scamScore,
        'trustLevel'           => $trustScore > 80 ? 'High' : ($trustScore > 50 ? 'Moderate' : 'Low'),
        'trustScore'           => $trustScore,
        'pricingConfidence'    => $pricingConf,
        'recommendedStrategy'  => $strategies[array_rand($strategies)],
        'painPoints'           => ['Finding an expert who communicates consistently','Previous freelancers missed deadlines','Fear of hidden costs','Lack of project updates'],
        'clientWants'          => ['A reliable partner they can trust','Proactive communication','Clean, high-quality deliverables','Quick turnaround'],
        'thingsToAvoid'        => ['Copy-paste templates','Radio silence','Starting with price discussions','Using tech jargon unnecessarily'],
        'aiTips'               => ['Reference a specific job detail in your hook','Show a measurable past result','Keep it under 200 words','Ask one action-oriented closing question'],
        'proposal'             => "Hello,\n\nI've reviewed your requirements and I'm confident I can help you deliver this successfully. My approach focuses on quality and clear communication at every milestone.\n\nWhat's your ideal start date for this project?",
    ];
}
