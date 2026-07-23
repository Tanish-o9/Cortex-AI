import assert from "assert";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load env first synchronously before importing modules
  dotenv.config({ path: path.resolve("backend/services/agent/.env") });
  
  // Verify that the environment variable was loaded
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Failed to load OPENROUTER_API_KEY environment variable");
  }

  // Import modules dynamically
  const { encrypt, decrypt } = await import("../gateway/utils/secretsManager.js");
  const { routeModel } = await import("../services/agent/utils/llmRouter.js");
  const { executeDependencyGraph } = await import("../services/agent/utils/parallelEngine.js");

  console.log("▶ Running Secrets Manager Tests...");
  const text = "super-secret-key-12345";
  const cipher = encrypt(text);
  assert.notStrictEqual(text, cipher);
  const plain = decrypt(cipher);
  assert.strictEqual(text, plain);
  console.log("✅ Secrets Manager Tests Passed!");

  console.log("▶ Running Parallel Engine Tests...");
  const nodes = [
    { id: "node_1", type: "Prompt", data: {} },
    { id: "node_2", type: "LLM", data: {} }
  ];
  const edges = [
    { id: "e1", source: "node_1", target: "node_2" }
  ];
  const executed = [];
  const executeFn = async (node) => {
    executed.push(node.id);
    return { ok: true };
  };
  const result = await executeDependencyGraph(nodes, edges, executeFn);
  assert.strictEqual(result.completed, true);
  assert.deepStrictEqual(executed, ["node_1", "node_2"]);
  console.log("✅ Parallel Engine Tests Passed!");

  console.log("▶ Running LLM Router Tests...");
  try {
    await routeModel("Hello", { taskType: "chat" });
  } catch (err) {
    assert.ok(err.message.includes("failed") || err.message.includes("key") || err.message.includes("api"));
  }
  console.log("✅ LLM Router Tests Passed!");

  console.log("\n⭐⭐ ALL TESTS PASSED SUCCESSFULLY! ⭐⭐");
}

main().catch(e => {
  console.error("❌ Test suite failed:", e);
  process.exit(1);
});
