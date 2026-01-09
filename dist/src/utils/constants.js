"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEEP_FEATURES = exports.CTA_CONTENT = exports.TESTIMONIALS = exports.USE_CASES = exports.PLATFORM_MODULES = exports.AI_RISKS = exports.HERO_CONTENT = exports.COLORS = void 0;
// Brand Colors (for reference)
exports.COLORS = {
    background: '#f8f9fc',
    foreground: '#0D1A2D',
    primary: '#3A66FF',
    secondary: '#E8F0FF',
    muted: '#444D56',
    accent: '#64C1FF',
};
// Hero Content
exports.HERO_CONTENT = {
    badge: "Introducing UK's AI Governance Platform",
    title: "NiyamR AI Governance",
    subtitle: "Secure, Govern & Scale AI With Confidence",
    description: "UK's most advanced AI Governance Platform — delivering real-time observability, security, compliance, and control across every model, agent, workflow, and dataset.",
    cta1: "Explore Platform",
    cta2: "Book Demo",
    trustBadges: [
        "UK Governance Certified",
        "Secure by Design",
        "ISO 27001",
        "SOC 2 Type II",
        "GDPR Compliant",
        "UK AI Act Ready"
    ]
};
// AI Risks
exports.AI_RISKS = [
    {
        id: 1,
        icon: "Ghost",
        title: "Shadow AI",
        description: "Untracked AI tools spreading across teams without oversight or governance"
    },
    {
        id: 2,
        icon: "ShieldAlert",
        title: "Data Leakage",
        description: "Sensitive data exposed through AI models and prompts without protection"
    },
    {
        id: 3,
        icon: "AlertTriangle",
        title: "Regulatory Non-Compliance",
        description: "Failure to meet UK AI Act and regulatory requirements"
    },
    {
        id: 4,
        icon: "Bot",
        title: "Hallucinations",
        description: "AI generating false or misleading information affecting business decisions"
    },
    {
        id: 5,
        icon: "Eye",
        title: "Unmonitored Behavior",
        description: "No visibility into AI actions, decisions, or performance metrics"
    }
];
// Platform Modules
exports.PLATFORM_MODULES = [
    {
        id: "observe",
        title: "AI Observe",
        subtitle: "Complete AI Asset Discovery",
        description: "Discover every AI asset — models, agents, copilots, APIs — across your entire organization with real-time monitoring.",
        features: [
            "Auto-discover all AI models & agents",
            "Real-time usage monitoring",
            "Shadow AI detection",
            "API & endpoint tracking"
        ],
        icon: "Radar",
        gradient: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)"
    },
    {
        id: "govern",
        title: "AI Govern",
        subtitle: "Policy & Compliance Engine",
        description: "Enforce policies, compliance rules, and safety guardrails across the entire AI lifecycle with automated governance.",
        features: [
            "UK AI Act compliance",
            "Automated policy enforcement",
            "Risk scoring & assessment",
            "Audit trail generation"
        ],
        icon: "Shield",
        gradient: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)"
    },
    {
        id: "defend",
        title: "AI Defend",
        subtitle: "Runtime Protection Layer",
        description: "Real-time protection against jailbreaks, prompt injection, data leakage, and adversarial attacks.",
        features: [
            "Prompt injection detection",
            "Jailbreak prevention",
            "Data leakage blocking",
            "Threat intelligence"
        ],
        icon: "ShieldCheck",
        gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)"
    },
    {
        id: "gateway",
        title: "AI Secure Gateway",
        subtitle: "Unified Control Plane",
        description: "Central gateway controlling LLM API access, quotas, routing, fallback logic, and API key security.",
        features: [
            "Multi-model routing",
            "Rate limiting & quotas",
            "API key management",
            "Cost optimization"
        ],
        icon: "Network",
        gradient: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)"
    }
];
// Use Cases
exports.USE_CASES = [
    {
        id: "financial",
        industry: "Financial Services",
        icon: "Banknote",
        description: "Secure AI operations while meeting FCA and regulatory requirements",
        benefits: [
            "Regulatory compliance automation",
            "Customer data protection",
            "Risk assessment & monitoring"
        ]
    },
    {
        id: "healthcare",
        industry: "Healthcare",
        icon: "HeartPulse",
        description: "HIPAA-compliant AI governance for healthcare organizations",
        benefits: [
            "Patient data protection",
            "Clinical AI oversight",
            "Regulatory documentation"
        ]
    },
    {
        id: "government",
        industry: "Government & Public Sector",
        icon: "Building2",
        description: "Secure-by-design AI for government agencies and public services",
        benefits: [
            "UK government standards",
            "Citizen data protection",
            "Transparency & accountability"
        ]
    },
    {
        id: "technology",
        industry: "Technology Enterprises",
        icon: "Cpu",
        description: "Scale AI innovation while maintaining security and control",
        benefits: [
            "Multi-team AI governance",
            "Developer productivity",
            "Cost optimization"
        ]
    }
];
// Testimonials
exports.TESTIMONIALS = [
    {
        id: 1,
        quote: "NiyamR transformed how we manage AI across our organization. The visibility and control are unmatched.",
        author: "Sarah Mitchell",
        role: "CISO",
        company: "Major UK Bank"
    },
    {
        id: 2,
        quote: "The automated compliance features saved us months of work preparing for UK AI Act requirements.",
        author: "James Patterson",
        role: "Head of Compliance",
        company: "Healthcare Provider"
    },
    {
        id: 3,
        quote: "Finally, a platform that gives us enterprise-grade AI security without slowing down innovation.",
        author: "Dr. Emily Chen",
        role: "VP of Engineering",
        company: "Tech Unicorn"
    }
];
// CTA Content
exports.CTA_CONTENT = {
    title: "Start Governing AI With Confidence",
    description: "Join leading UK organizations securing their AI operations",
    cta1: "Get a Demo",
    cta2: "Explore Documentation"
};
exports.DEEP_FEATURES = [
    {
        id: "discovery",
        title: "AI Asset Discovery",
        description: "Automatically discover and catalog every AI model, agent, and API across your organization"
    },
    {
        id: "policy",
        title: "Policy Enforcement & Guardrails",
        description: "Set and enforce organization-wide policies with automated guardrails"
    },
    {
        id: "runtime",
        title: "Runtime Threat Detection",
        description: "Real-time detection and blocking of malicious prompts and attacks"
    },
    {
        id: "compliance",
        title: "UK AI Act Compliance",
        description: "Automated compliance monitoring and reporting for UK regulations"
    }
];
//# sourceMappingURL=constants.js.map