"use strict";
/**
 * Policies API Controller
 * Handles CRUD operations for policies (both external and internal)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicies = getPolicies;
exports.createPolicy = createPolicy;
exports.getPolicyById = getPolicyById;
exports.updatePolicy = updatePolicy;
exports.deletePolicy = deletePolicy;
exports.updatePolicyRequirement = updatePolicyRequirement;
exports.deletePolicyRequirement = deletePolicyRequirement;
exports.getPolicyRequirements = getPolicyRequirements;
exports.createPolicyRequirement = createPolicyRequirement;
const server_1 = require("../../utils/supabase/server");
/**
 * GET /api/policies - List all policies
 */
async function getPolicies(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { data: policies, error } = await supabase
            .from("policies")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Error fetching policies:", error);
            return res.status(500).json({ error: "Failed to fetch policies" });
        }
        return res.json(policies || []);
    }
    catch (err) {
        console.error("Error in GET /api/policies:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * POST /api/policies - Create a new internal policy
 */
async function createPolicy(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const body = req.body;
        // Validate required fields
        if (!body.name) {
            return res.status(400).json({ error: "Policy name is required" });
        }
        // Create policy (only internal policies can be created via API)
        const { data: policy, error } = await supabase
            .from("policies")
            .insert({
            name: body.name,
            policy_type: "Internal",
            description: body.description || null,
            applies_to: body.applies_to || "All AI",
            enforcement_level: body.enforcement_level || "Mandatory",
            owner: body.owner || null,
            effective_date: body.effective_date || null,
            version: body.version || "1.0",
            document_url: body.document_url || null,
            status: "Active",
            created_by: user.id,
        })
            .select()
            .single();
        if (error) {
            console.error("Error creating policy:", error);
            return res.status(500).json({ error: "Failed to create policy" });
        }
        return res.status(201).json(policy);
    }
    catch (err) {
        console.error("Error in POST /api/policies:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * GET /api/policies/[id] - Get a specific policy with requirements
 */
async function getPolicyById(req, res) {
    try {
        const { id } = req.params;
        const supabase = await (0, server_1.createClient)();
        const { data, error } = await supabase
            .from("policies")
            .select(`
        *,
        policy_requirements (
          id,
          title,
          description,
          requirement_code,
          applies_to_scope,
          compliance_status,
          notes,
          display_order
        )
      `)
            .eq("id", id)
            .maybeSingle();
        if (error) {
            console.error("Policy fetch error:", error);
            return res.status(403).json({ error: error.message });
        }
        if (!data) {
            return res.status(404).json({ error: "Policy not found" });
        }
        return res.json({
            ...data,
            requirements: data.policy_requirements ?? [],
        });
    }
    catch (err) {
        console.error("Error in GET /api/policies/[id]:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * PUT /api/policies/[id] - Update a specific policy
 */
async function updatePolicy(req, res) {
    try {
        const { id } = req.params;
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const body = req.body;
        const { data: existingPolicy } = await supabase
            .from("policies")
            .select("created_by, policy_type")
            .eq("id", id)
            .maybeSingle();
        if (!existingPolicy) {
            return res.status(404).json({ error: "Policy not found" });
        }
        if (existingPolicy.policy_type === "External") {
            return res.status(403).json({ error: "External policies cannot be updated" });
        }
        const isAdmin = user.user_metadata?.role === "admin" ||
            user.user_metadata?.role === "Admin";
        if (existingPolicy.created_by !== user.id && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized to update this policy" });
        }
        const { data, error } = await supabase
            .from("policies")
            .update({
            name: body.name,
            description: body.description,
            summary: body.summary,
            applies_to: body.applies_to,
            enforcement_level: body.enforcement_level,
            owner: body.owner,
            effective_date: body.effective_date,
            version: body.version,
            status: body.status,
            document_url: body.document_url,
        })
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error) {
            console.error("Policy update error:", error);
            return res.status(500).json({ error: "Failed to update policy" });
        }
        return res.json(data);
    }
    catch (err) {
        console.error("Error in PUT /api/policies/[id]:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * DELETE /api/policies/[id] - Delete a specific policy
 */
async function deletePolicy(req, res) {
    try {
        const { id } = req.params;
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const isAdmin = user.user_metadata?.role === "admin" ||
            user.user_metadata?.role === "Admin";
        if (!isAdmin) {
            return res.status(403).json({ error: "Only admins can delete policies" });
        }
        const { data: existingPolicy } = await supabase
            .from("policies")
            .select("policy_type")
            .eq("id", id)
            .maybeSingle();
        if (!existingPolicy) {
            return res.status(404).json({ error: "Policy not found" });
        }
        if (existingPolicy.policy_type === "External") {
            return res.status(403).json({ error: "External policies cannot be deleted" });
        }
        const { error } = await supabase
            .from("policies")
            .delete()
            .eq("id", id);
        if (error) {
            console.error("Policy delete error:", error);
            return res.status(500).json({ error: "Failed to delete policy" });
        }
        return res.json({ success: true });
    }
    catch (err) {
        console.error("Error in DELETE /api/policies/[id]:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * PUT /api/policies/[id]/requirements/[requirementId] - Update a requirement
 */
async function updatePolicyRequirement(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const requirementId = req.params.requirementId;
        const body = req.body;
        // Update requirement
        const { data: requirement, error } = await supabase
            .from("policy_requirements")
            .update({
            title: body.title,
            description: body.description,
            requirement_code: body.requirement_code,
            applies_to_scope: body.applies_to_scope,
            compliance_status: body.compliance_status,
            notes: body.notes,
            display_order: body.display_order,
        })
            .eq("id", requirementId)
            .select()
            .single();
        if (error) {
            console.error("Error updating requirement:", error);
            return res.status(500).json({ error: "Failed to update requirement" });
        }
        if (!requirement) {
            return res.status(404).json({ error: "Requirement not found" });
        }
        return res.json(requirement);
    }
    catch (err) {
        console.error("Error in PUT /api/policies/[id]/requirements/[requirementId]:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * DELETE /api/policies/[id]/requirements/[requirementId] - Delete a requirement
 */
async function deletePolicyRequirement(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const requirementId = req.params.requirementId;
        // Delete requirement
        const { error } = await supabase
            .from("policy_requirements")
            .delete()
            .eq("id", requirementId);
        if (error) {
            console.error("Error deleting requirement:", error);
            return res.status(500).json({ error: "Failed to delete requirement" });
        }
        return res.json({ success: true });
    }
    catch (err) {
        console.error("Error in DELETE /api/policies/[id]/requirements/[requirementId]:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * GET /api/policies/[id]/requirements - Get all requirements for a policy
 */
async function getPolicyRequirements(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const policyId = req.params.id;
        const { data: requirements, error } = await supabase
            .from("policy_requirements")
            .select("*")
            .eq("policy_id", policyId)
            .order("display_order", { ascending: true });
        if (error) {
            console.error("Error fetching requirements:", error);
            return res.status(500).json({ error: "Failed to fetch requirements" });
        }
        return res.json(requirements || []);
    }
    catch (err) {
        console.error("Error in GET /api/policies/[id]/requirements:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
/**
 * POST /api/policies/[id]/requirements - Create a new requirement
 */
async function createPolicyRequirement(req, res) {
    try {
        const supabase = await (0, server_1.createClient)();
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const policyId = req.params.id;
        const body = req.body;
        // Validate required fields
        if (!body.title) {
            return res.status(400).json({ error: "Requirement title is required" });
        }
        // Check if policy exists
        const { data: policy } = await supabase
            .from("policies")
            .select("policy_type")
            .eq("id", policyId)
            .single();
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }
        // Create requirement
        const { data: requirement, error } = await supabase
            .from("policy_requirements")
            .insert({
            policy_id: policyId,
            title: body.title,
            description: body.description || null,
            requirement_code: body.requirement_code || null,
            applies_to_scope: body.applies_to_scope || "All AI",
            display_order: body.display_order || 0,
            compliance_status: "Not assessed",
        })
            .select()
            .single();
        if (error) {
            console.error("Error creating requirement:", error);
            return res.status(500).json({ error: "Failed to create requirement" });
        }
        return res.status(201).json(requirement);
    }
    catch (err) {
        console.error("Error in POST /api/policies/[id]/requirements:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}
//# sourceMappingURL=policies.controller.js.map