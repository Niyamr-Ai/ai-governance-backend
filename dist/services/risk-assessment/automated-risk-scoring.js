"use strict";
/**
 * Automated Risk Scoring Engine
 *
 * Rules-based engine for calculating risk scores across 5 dimensions:
 * Technical, Operational, Legal/Regulatory, Ethical/Societal, Business
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRiskScores = calculateRiskScores;
const DEFAULT_WEIGHTS = {
    technical: 0.2,
    operational: 0.2,
    legal_regulatory: 0.25,
    ethical_societal: 0.2,
    business: 0.15,
};
/**
 * Calculate Technical Risk Score (1-10)
 * Based on: Model complexity, accuracy, robustness, data quality, security
 */
function calculateTechnicalRisk(data) {
    let score = 5; // Start at medium
    const findings = [];
    const gaps = [];
    const recommendations = [];
    // Check risk assessments for technical issues
    const technicalAssessments = data.approved_risk_assessments?.filter((ra) => ['robustness', 'privacy', 'explainability'].includes(ra.category)) || [];
    const highRiskTechnical = technicalAssessments.filter((ra) => ra.risk_level === 'high').length;
    const mediumRiskTechnical = technicalAssessments.filter((ra) => ra.risk_level === 'medium').length;
    if (highRiskTechnical > 0) {
        score += highRiskTechnical * 2; // +2 per high risk
        findings.push(`${highRiskTechnical} high-risk technical assessment(s) found`);
    }
    if (mediumRiskTechnical > 0) {
        score += mediumRiskTechnical * 1; // +1 per medium risk
        findings.push(`${mediumRiskTechnical} medium-risk technical assessment(s) found`);
    }
    // Check mitigation status
    const unmitigated = technicalAssessments.filter((ra) => ra.mitigation_status !== 'mitigated').length;
    if (unmitigated > 0) {
        score += 1;
        gaps.push(`${unmitigated} technical risk(s) not yet mitigated`);
        recommendations.push('Implement mitigation strategies for identified technical risks');
    }
    // Check compliance obligations (data governance, security)
    if (data.high_risk_missing?.some((m) => m.includes('Data') || m.includes('Security'))) {
        score += 1.5;
        gaps.push('Missing data governance or security obligations');
        recommendations.push('Address data governance and security requirements');
    }
    // Critical risk systems have higher technical complexity and requirements
    if (data._framework === 'MAS' && data._original_risk_level === 'Critical') {
        score += 3.5; // Critical systems typically have very complex technical requirements
        findings.push('Critical risk system requires enhanced technical safeguards');
        gaps.push('Critical risk classification indicates need for robust technical controls');
        recommendations.push('Implement advanced technical safeguards for critical risk system');
    }
    else if (data._framework === 'UK' && data._original_risk_level &&
        (data._original_risk_level.toLowerCase().includes('frontier') ||
            data._original_risk_level.toLowerCase().includes('high-impact'))) {
        score += 2.5; // Frontier models have high technical complexity
        findings.push('Frontier/High-Impact model requires advanced technical capabilities');
    }
    // Normalize to 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));
    return {
        score,
        detail: {
            score,
            rationale: `Technical risk assessed based on ${technicalAssessments.length} technical risk assessment(s) and compliance obligations`,
            key_findings: findings.length > 0 ? findings : ['No major technical risks identified'],
            compliance_gaps: gaps,
            recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring technical performance'],
        },
    };
}
/**
 * Calculate Operational Risk Score (1-10)
 * Based on: Deployment maturity, monitoring, incident response, uptime, dependencies
 */
function calculateOperationalRisk(data) {
    let score = 5; // Start at medium
    const findings = [];
    const gaps = [];
    const recommendations = [];
    // Lifecycle stage indicates maturity
    const lifecycleStage = data.lifecycle_stage?.toLowerCase() || 'draft';
    if (lifecycleStage === 'draft' || lifecycleStage === 'development') {
        score += 2;
        findings.push('System in early lifecycle stage');
        gaps.push('Limited operational history');
        recommendations.push('Establish operational monitoring before deployment');
    }
    else if (lifecycleStage === 'deployed' || lifecycleStage === 'monitoring') {
        score -= 1; // Lower risk for deployed systems
        findings.push('System is deployed and operational');
    }
    // Check monitoring requirements
    if (data.post_market_monitoring) {
        score -= 1;
        findings.push('Post-market monitoring in place');
    }
    else if (data.risk_tier === 'High-risk' || data.risk_tier === 'Prohibited') {
        score += 1.5;
        gaps.push('Post-market monitoring not implemented for high-risk system');
        recommendations.push('Implement post-market monitoring plan');
    }
    // Check incident reporting
    if (!data.fria_completed && (data.risk_tier === 'High-risk' || data.risk_tier === 'Prohibited')) {
        score += 1;
        gaps.push('FRIA not completed');
        recommendations.push('Complete Fundamental Rights Impact Assessment');
    }
    // Critical risk systems require enhanced operational controls
    if (data._framework === 'MAS' && data._original_risk_level === 'Critical') {
        score += 3; // Critical systems need very robust operational monitoring
        findings.push('Critical risk system requires enhanced operational oversight');
        gaps.push('Critical risk classification requires comprehensive operational controls');
        recommendations.push('Implement enhanced operational monitoring and incident response for critical system');
    }
    else if (data._framework === 'UK' && data._original_risk_level &&
        (data._original_risk_level.toLowerCase().includes('frontier') ||
            data._original_risk_level.toLowerCase().includes('high-impact'))) {
        score += 2; // Frontier models need enhanced operational controls
        findings.push('Frontier/High-Impact model requires enhanced operational oversight');
    }
    // Normalize to 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));
    return {
        score,
        detail: {
            score,
            rationale: `Operational risk assessed based on lifecycle stage (${lifecycleStage}) and monitoring capabilities`,
            key_findings: findings.length > 0 ? findings : ['Operational processes appear adequate'],
            compliance_gaps: gaps,
            recommendations: recommendations.length > 0 ? recommendations : ['Maintain current operational standards'],
        },
    };
}
/**
 * Calculate Legal/Regulatory Risk Score (1-10)
 * Based on: GDPR, EU AI Act classification, industry regulations, IP, cross-border transfers
 */
function calculateLegalRegulatoryRisk(data) {
    let score = 5; // Start at medium
    const findings = [];
    const gaps = [];
    const recommendations = [];
    // Risk tier directly impacts legal risk
    if (data.risk_tier === 'Prohibited') {
        score = 10; // Maximum risk
        findings.push('System engages in prohibited practices');
        gaps.push('Prohibited practices detected - immediate legal risk');
        recommendations.push('Discontinue prohibited practices immediately');
    }
    else if (data.risk_tier === 'High-risk') {
        // For UK/MAS systems, check original risk level for more granular scoring
        if (data._framework === 'UK' && data._original_risk_level) {
            const ukLevel = data._original_risk_level.toLowerCase();
            if (ukLevel.includes('frontier') || ukLevel.includes('high-impact')) {
                score += 3.5; // Frontier models have higher legal risk
                findings.push('System classified as Frontier/High-Impact Model under UK AI Act');
            }
            else {
                score += 2.5;
                findings.push('System classified as high-risk under UK AI Act');
            }
        }
        else if (data._framework === 'MAS' && data._original_risk_level) {
            const masLevel = data._original_risk_level;
            if (masLevel === 'Critical') {
                score += 4; // Critical risk systems have very high legal exposure
                findings.push('System classified as Critical risk under MAS framework');
            }
            else if (masLevel === 'High') {
                score += 2.5;
                findings.push('System classified as High risk under MAS framework');
            }
        }
        else {
            // EU systems
            score += 2.5;
            findings.push('System classified as high-risk under EU AI Act');
            if (!data.high_risk_all_fulfilled) {
                score += 1.5;
                gaps.push('High-risk obligations not fully met');
                recommendations.push('Complete all high-risk obligations');
            }
        }
    }
    else if (data.risk_tier === 'Limited-risk') {
        score += 1;
        findings.push('System subject to transparency requirements');
    }
    // Compliance status
    if (data.compliance_status === 'Non-compliant') {
        score += 2;
        findings.push('System is non-compliant');
        gaps.push('Compliance gaps identified');
        recommendations.push('Address compliance gaps to reduce legal risk');
    }
    else if (data.compliance_status === 'Partially compliant') {
        score += 1;
        findings.push('System is partially compliant');
        gaps.push('Some compliance requirements unmet');
    }
    // Missing obligations
    if (data.high_risk_missing && data.high_risk_missing.length > 0) {
        score += data.high_risk_missing.length * 0.5;
        gaps.push(`${data.high_risk_missing.length} high-risk obligation(s) missing`);
        recommendations.push('Address missing high-risk obligations');
    }
    // Transparency requirements
    if (data.transparency_required) {
        findings.push('Transparency requirements apply');
    }
    // Normalize to 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));
    return {
        score,
        detail: {
            score,
            rationale: `Legal/regulatory risk assessed based on risk tier (${data.risk_tier || 'Unknown'}) and compliance status (${data.compliance_status || 'Unknown'})`,
            key_findings: findings.length > 0 ? findings : ['No major legal/regulatory risks identified'],
            compliance_gaps: gaps,
            recommendations: recommendations.length > 0 ? recommendations : ['Maintain compliance monitoring'],
        },
    };
}
/**
 * Calculate Ethical/Societal Risk Score (1-10)
 * Based on: Bias, fairness, transparency, human oversight, environmental impact, social harm
 */
function calculateEthicalSocietalRisk(data) {
    let score = 5; // Start at medium
    const findings = [];
    const gaps = [];
    const recommendations = [];
    // Check bias and fairness assessments
    const biasAssessments = data.approved_risk_assessments?.filter((ra) => ra.category === 'bias') || [];
    const highBiasRisk = biasAssessments.filter((ra) => ra.risk_level === 'high').length;
    const mediumBiasRisk = biasAssessments.filter((ra) => ra.risk_level === 'medium').length;
    if (highBiasRisk > 0) {
        score += highBiasRisk * 2.5;
        findings.push(`${highBiasRisk} high-risk bias assessment(s) found`);
        gaps.push('Significant bias risks identified');
        recommendations.push('Implement bias mitigation measures');
    }
    else if (mediumBiasRisk > 0) {
        score += mediumBiasRisk * 1.5;
        findings.push(`${mediumBiasRisk} medium-risk bias assessment(s) found`);
        recommendations.push('Monitor and address bias concerns');
    }
    // Check explainability assessments
    const explainabilityAssessments = data.approved_risk_assessments?.filter((ra) => ra.category === 'explainability') || [];
    const highExplainabilityRisk = explainabilityAssessments.filter((ra) => ra.risk_level === 'high').length;
    if (highExplainabilityRisk > 0) {
        score += 1.5;
        findings.push('Low explainability identified');
        gaps.push('System lacks adequate explainability');
        recommendations.push('Improve system explainability and transparency');
    }
    // Transparency requirements
    if (data.transparency_required) {
        findings.push('Transparency requirements apply');
    }
    // Prohibited practices indicate high ethical risk
    if (data.prohibited_practices_detected) {
        score = 10; // Maximum risk
        findings.push('Prohibited practices detected');
        gaps.push('Ethical violations identified');
        recommendations.push('Discontinue prohibited practices');
    }
    // Environmental impact (compute carbon footprint)
    // High-risk systems or complex models typically have higher compute requirements
    if (data.risk_tier === 'High-risk' || data.risk_tier === 'Prohibited') {
        // For UK/MAS, check original risk level
        if (data._framework === 'UK' && data._original_risk_level) {
            const ukLevel = data._original_risk_level.toLowerCase();
            if (ukLevel.includes('frontier') || ukLevel.includes('high-impact')) {
                score += 1; // Frontier models typically have very high compute requirements
                findings.push('Frontier/High-Impact model likely has significant compute requirements');
            }
            else {
                score += 0.5;
                findings.push('System may have significant compute requirements');
            }
        }
        else if (data._framework === 'MAS' && data._original_risk_level === 'Critical') {
            score += 2.5; // Critical risk systems have very high ethical/societal concerns
            findings.push('Critical risk system poses significant ethical and societal considerations');
            gaps.push('Critical risk classification indicates potential for significant societal impact');
            recommendations.push('Address ethical implications and societal impact of critical risk system');
        }
        else {
            score += 0.5;
            findings.push('System may have significant compute requirements');
        }
        recommendations.push('Consider environmental impact and optimize compute efficiency');
    }
    // Critical risk systems have elevated ethical/societal concerns beyond compute
    if (data._framework === 'MAS' && data._original_risk_level === 'Critical') {
        score += 2; // Additional boost for critical ethical/societal impact
        findings.push('Critical risk classification indicates potential for significant societal harm');
        recommendations.push('Conduct comprehensive ethical impact assessment');
    }
    // Check if system has high technical complexity (indicator of compute needs)
    const technicalAssessments = data.approved_risk_assessments?.filter((ra) => ['robustness', 'explainability'].includes(ra.category)) || [];
    if (technicalAssessments.length > 2) {
        score += 0.3; // Multiple technical assessments may indicate complex system
        findings.push('System complexity may contribute to environmental impact');
    }
    // Normalize to 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));
    return {
        score,
        detail: {
            score,
            rationale: `Ethical/societal risk assessed based on ${biasAssessments.length} bias assessment(s), ${explainabilityAssessments.length} explainability assessment(s), and environmental considerations`,
            key_findings: findings.length > 0 ? findings : ['No major ethical/societal risks identified'],
            compliance_gaps: gaps,
            recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring ethical implications'],
        },
    };
}
/**
 * Calculate Business Risk Score (1-10)
 * Based on: Financial impact, reputational risk, customer trust, competitive sensitivity, regulatory penalties
 */
function calculateBusinessRisk(data) {
    let score = 5; // Start at medium
    const findings = [];
    const gaps = [];
    const recommendations = [];
    // Compliance status affects business risk
    if (data.compliance_status === 'Non-compliant') {
        score += 2.5;
        findings.push('Non-compliance poses regulatory penalty risk');
        gaps.push('Regulatory penalties possible');
        recommendations.push('Achieve compliance to avoid penalties');
    }
    else if (data.compliance_status === 'Partially compliant') {
        score += 1.5;
        findings.push('Partial compliance may impact business operations');
    }
    // Prohibited practices = maximum business risk
    if (data.prohibited_practices_detected) {
        score = 10;
        findings.push('Prohibited practices pose severe reputational and financial risk');
        gaps.push('Immediate business risk from prohibited practices');
        recommendations.push('Address prohibited practices to protect business reputation');
    }
    // High-risk systems have higher business impact
    if (data.risk_tier === 'High-risk' || data.risk_tier === 'Prohibited') {
        // For UK/MAS, use original risk level for more granular scoring
        if (data._framework === 'UK' && data._original_risk_level) {
            const ukLevel = data._original_risk_level.toLowerCase();
            if (ukLevel.includes('frontier') || ukLevel.includes('high-impact')) {
                score += 2.5; // Frontier models have higher business impact
                findings.push('Frontier/High-Impact classification significantly increases business exposure');
            }
            else {
                score += 1.5;
                findings.push('High-risk classification increases business exposure');
            }
        }
        else if (data._framework === 'MAS' && data._original_risk_level) {
            const masLevel = data._original_risk_level;
            if (masLevel === 'Critical') {
                score += 3.5; // Critical risk has very high business impact
                findings.push('Critical risk classification significantly increases business exposure');
                gaps.push('Critical risk poses severe financial and reputational risks');
                recommendations.push('Implement comprehensive risk mitigation strategies for critical business exposure');
            }
            else {
                score += 1.5;
                findings.push('High-risk classification increases business exposure');
            }
        }
        else {
            score += 1.5;
            findings.push('High-risk classification increases business exposure');
        }
    }
    // Unmitigated risks increase business risk
    const unmitigatedRisks = data.approved_risk_assessments?.filter((ra) => ra.mitigation_status !== 'mitigated' && ra.risk_level === 'high').length || 0;
    if (unmitigatedRisks > 0) {
        score += unmitigatedRisks * 0.5;
        findings.push(`${unmitigatedRisks} unmitigated high-risk assessment(s)`);
        recommendations.push('Mitigate high-risk assessments to reduce business exposure');
    }
    // Sector-specific considerations
    if (data.sector === 'finance' || data.sector === 'healthcare') {
        score += 0.5; // Higher scrutiny sectors
        findings.push(`System operates in ${data.sector} sector with increased regulatory scrutiny`);
    }
    // Normalize to 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));
    return {
        score,
        detail: {
            score,
            rationale: `Business risk assessed based on compliance status, risk tier, and unmitigated risks`,
            key_findings: findings.length > 0 ? findings : ['Business risk appears manageable'],
            compliance_gaps: gaps,
            recommendations: recommendations.length > 0 ? recommendations : ['Monitor business impact'],
        },
    };
}
/**
 * Calculate weighted composite score
 */
function calculateCompositeScore(scores, weights = DEFAULT_WEIGHTS) {
    const composite = scores.technical * weights.technical +
        scores.operational * weights.operational +
        scores.legal_regulatory * weights.legal_regulatory +
        scores.ethical_societal * weights.ethical_societal +
        scores.business * weights.business;
    return Math.round(composite * 100) / 100; // Round to 2 decimal places
}
/**
 * Determine overall risk level from composite score
 */
function determineRiskLevel(compositeScore) {
    if (compositeScore >= 9)
        return 'Critical';
    if (compositeScore >= 7)
        return 'High';
    if (compositeScore >= 4)
        return 'Medium';
    return 'Low';
}
/**
 * Calculate all risk dimension scores
 */
function calculateRiskScores(systemData, weights) {
    const finalWeights = { ...DEFAULT_WEIGHTS, ...weights };
    // Normalize weights to sum to 1
    const weightSum = Object.values(finalWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(finalWeights).forEach((key) => {
        finalWeights[key] /= weightSum;
    });
    const technical = calculateTechnicalRisk(systemData);
    const operational = calculateOperationalRisk(systemData);
    const legalRegulatory = calculateLegalRegulatoryRisk(systemData);
    const ethicalSocietal = calculateEthicalSocietalRisk(systemData);
    const business = calculateBusinessRisk(systemData);
    const scores = {
        technical: technical.score,
        operational: operational.score,
        legal_regulatory: legalRegulatory.score,
        ethical_societal: ethicalSocietal.score,
        business: business.score,
    };
    const compositeScore = calculateCompositeScore(scores, finalWeights);
    const overallRiskLevel = determineRiskLevel(compositeScore);
    const dimensionDetails = {
        technical: technical.detail,
        operational: operational.detail,
        legal_regulatory: legalRegulatory.detail,
        ethical_societal: ethicalSocietal.detail,
        business: business.detail,
    };
    return {
        scores,
        compositeScore,
        overallRiskLevel,
        dimensionDetails,
        finalWeights,
    };
}
//# sourceMappingURL=automated-risk-scoring.js.map