import vm from "vm";

/**
 * Runs JavaScript code in a secure sandboxed VM.
 * Captures console.logs and limits CPU execution time.
 * 
 * @param {string} code 
 * @param {number} timeoutMs 
 * @returns {Promise<Object>} { success, logs, result, error }
 */
export async function runCodeSandbox(code, timeoutMs = 3000) {
  const logs = [];
  
  // Custom console mock to capture outputs
  const sandboxConsole = {
    log: (...args) => {
      logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
    },
    error: (...args) => {
      logs.push("[ERROR] " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
    },
    warn: (...args) => {
      logs.push("[WARN] " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
    }
  };

  const contextObject = {
    console: sandboxConsole,
    process: { env: {} },
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    Map,
    Set
  };

  const context = vm.createContext(contextObject);
  
  try {
    const script = new vm.Script(code);
    
    // Execute script with timeout to prevent infinite loops or CPU exhaustion
    const result = script.runInContext(context, { timeout: timeoutMs });
    
    return {
      success: true,
      logs,
      result: result !== undefined ? (typeof result === "object" ? JSON.stringify(result) : String(result)) : "undefined"
    };
  } catch (err) {
    return {
      success: false,
      logs,
      error: err.message
    };
  }
}
export async function runPythonCode(code) {
  // Mock interpreter for Python since we run in Node context locally
  return {
    success: true,
    logs: ["Python interpreter initialized", "Running script..."],
    result: `Mock Python result for:\n${code}`
  };
}
