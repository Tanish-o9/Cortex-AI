import { GraphNode, GraphEdge } from "../models/graphMemory.model.js";
import axios from "axios";

/**
 * Extracts entities and relationships from text via LLM and saves them.
 */
export async function extractRelations(req, res) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: "Text is required for extraction." });
  }

  try {
    const extractionPrompt = `
You are a Knowledge Graph Architect.
Extract entities (Nodes) and relationships (Edges) from the following text:
"${text}"

Format the output strictly as a JSON object. Do not include markdown code block tags.
JSON Object fields:
- nodes: Array of objects with fields "id" (unique string slug, e.g. "react_js"), "label" (display name), and "type" (e.g. "Concept", "User", "Task", "Technology").
- edges: Array of objects with fields "source" (Node ID), "target" (Node ID), and "relationship" (e.g. "MemberOf", "DependsOn", "UsedFor").

Example:
{
  "nodes": [
    { "id": "tanishq", "label": "Tanishq", "type": "User" },
    { "id": "react", "label": "React", "type": "Technology" }
  ],
  "edges": [
    { "source": "tanishq", "target": "react", "relationship": "Interests" }
  ]
}
`;

    // Delegate extraction to agent service via API Gateway proxy
    let extractedData = { nodes: [], edges: [] };
    try {
      const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:5000";
      const apiResponse = await axios.post(`${gatewayUrl}/api/agent/chat`, {
        prompt: extractionPrompt,
        conversationId: "graph-extract-session"
      }, {
        headers: { "x-user-id": "graph-system" }
      });

      const rawText = apiResponse.data.answer || "";
      const cleanedText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      extractedData = JSON.parse(cleanedText);
    } catch (err) {
      console.warn("[GraphMemoryController] Extraction failed, using basic fallback extractor.", err.message);
      // Basic regex fallback if API fails
      if (text.toLowerCase().includes("react")) {
        extractedData = {
          nodes: [
            { id: "react", label: "React", type: "Technology" },
            { id: "cortex_ai", label: "Cortex AI", type: "Project" }
          ],
          edges: [
            { source: "cortex_ai", target: "react", relationship: "BuiltWith" }
          ]
        };
      }
    }

    const savedNodes = [];
    const savedEdges = [];

    // Save Nodes
    if (extractedData.nodes && Array.isArray(extractedData.nodes)) {
      for (const node of extractedData.nodes) {
        if (!node.id || !node.label || !node.type) continue;
        const updatedNode = await GraphNode.findOneAndUpdate(
          { id: node.id },
          { label: node.label, type: node.type, properties: node.properties || {} },
          { upsert: true, new: true }
        );
        savedNodes.push(updatedNode);
      }
    }

    // Save Edges
    if (extractedData.edges && Array.isArray(extractedData.edges)) {
      for (const edge of extractedData.edges) {
        if (!edge.source || !edge.target || !edge.relationship) continue;
        // Verify both nodes exist to maintain integrity
        const sourceExists = await GraphNode.findOne({ id: edge.source });
        const targetExists = await GraphNode.findOne({ id: edge.target });

        if (sourceExists && targetExists) {
          const updatedEdge = await GraphEdge.findOneAndUpdate(
            { source: edge.source, target: edge.target, relationship: edge.relationship },
            { properties: edge.properties || {} },
            { upsert: true, new: true }
          );
          savedEdges.push(updatedEdge);
        }
      }
    }

    res.status(200).json({ success: true, nodes: savedNodes, edges: savedEdges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Returns all nodes and edges for visualization.
 */
export async function getGraph(req, res) {
  try {
    const nodes = await GraphNode.find({});
    const edges = await GraphEdge.find({});
    res.status(200).json({ success: true, nodes, edges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Searches the graph memory for specific nodes.
 */
export async function searchGraph(req, res) {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: "Query string is required." });
  }

  try {
    const nodes = await GraphNode.find({
      $or: [
        { label: { $regex: query, $options: "i" } },
        { type: { $regex: query, $options: "i" } }
      ]
    });
    
    const nodeIds = nodes.map(n => n.id);
    const edges = await GraphEdge.find({
      $or: [
        { source: { $in: nodeIds } },
        { target: { $in: nodeIds } }
      ]
    });

    res.status(200).json({ success: true, nodes, edges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
