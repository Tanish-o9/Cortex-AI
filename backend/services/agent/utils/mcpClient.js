import axios from "axios";

// Local registry of connected MCP servers
const mcpServersRegistry = new Map(); // name -> config { url, token }

/**
 * Registers an external MCP server config.
 */
export function registerMcpServer(name, config) {
  mcpServersRegistry.set(name, config);
  console.log(`[MCP] Registered external server: ${name} (URL: ${config.url})`);
}

/**
 * Connects to all registered MCP servers and lists their tools.
 */
export async function discoverMcpTools() {
  const discoveredTools = [];
  
  for (const [name, config] of mcpServersRegistry.entries()) {
    try {
      const response = await axios.get(`${config.url}/tools`, {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
        timeout: 3000
      });
      if (response.data && Array.isArray(response.data.tools)) {
        response.data.tools.forEach(tool => {
          discoveredTools.push({
            serverName: name,
            ...tool
          });
        });
      }
    } catch (error) {
      console.warn(`⚠️ [MCP] Failed to discover tools from server ${name}: ${error.message}`);
    }
  }
  
  return discoveredTools;
}

/**
 * Invokes a tool on a specific external MCP server.
 */
export async function invokeMcpTool(serverName, toolName, args) {
  const config = mcpServersRegistry.get(serverName);
  if (!config) {
    throw new Error(`MCP server '${serverName}' is not registered`);
  }
  
  try {
    const response = await axios.post(`${config.url}/tools/${toolName}/invoke`, { arguments: args }, {
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`❌ [MCP] Failed invoking tool ${toolName} on server ${serverName}: ${error.message}`);
    throw error;
  }
}

/**
 * Discovers prompts from external MCP servers.
 */
export async function discoverMcpPrompts() {
  const discoveredPrompts = [];
  for (const [name, config] of mcpServersRegistry.entries()) {
    try {
      const response = await axios.get(`${config.url}/prompts`, {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
        timeout: 3000
      });
      if (response.data && Array.isArray(response.data.prompts)) {
        response.data.prompts.forEach(prompt => {
          discoveredPrompts.push({
            serverName: name,
            ...prompt
          });
        });
      }
    } catch (error) {
      console.warn(`⚠️ [MCP] Failed to discover prompts from server ${name}: ${error.message}`);
    }
  }
  return discoveredPrompts;
}

/**
 * Discovers resources from external MCP servers.
 */
export async function discoverMcpResources() {
  const discoveredResources = [];
  for (const [name, config] of mcpServersRegistry.entries()) {
    try {
      const response = await axios.get(`${config.url}/resources`, {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
        timeout: 3000
      });
      if (response.data && Array.isArray(response.data.resources)) {
        response.data.resources.forEach(resource => {
          discoveredResources.push({
            serverName: name,
            ...resource
          });
        });
      }
    } catch (error) {
      console.warn(`⚠️ [MCP] Failed to discover resources from server ${name}: ${error.message}`);
    }
  }
  return discoveredResources;
}
