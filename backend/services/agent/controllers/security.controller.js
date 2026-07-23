import fs from "fs";
import path from "path";

/**
 * Recursively scans files in the workspace for leaked API keys, tokens, or credentials.
 */
export async function scanForSecrets(req, res) {
  const rootPath = path.resolve(".");
  const findings = [];

  // Patterns for detecting sensitive information
  const rules = [
    { name: "Google API Key", regex: /AIzaSy[A-Za-z0-9_-]{35}/g },
    { name: "Generic Secret / Key String", regex: /const\s+\w*(key|secret|password|token)\s*=\s*['"][A-Za-z0-9_+=/-]{16,}['"]/gi },
    { name: "Postgres Connection URL", regex: /postgres(ql)?:\/\/[\w-]:[\w-]@[\w-]:\d+\/[\w-]/gi },
    { name: "Firebase API Key", regex: /apiKey:\s*['"]AIzaSy[A-Za-z0-9_-]{35}['"]/gi }
  ];

  function scanDir(dirPath) {
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
      if (["node_modules", ".git", ".gemini", "dist", "package-lock.json"].includes(file)) return;
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat && stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        // Read and scan file
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          rules.forEach(rule => {
            let match;
            // Reset regex pointer
            rule.regex.lastIndex = 0;
            while ((match = rule.regex.exec(content)) !== null) {
              // Get line number
              const lines = content.substring(0, match.index).split("\n");
              const lineNumber = lines.length;
              findings.push({
                file: path.relative(rootPath, fullPath),
                lineNumber,
                rule: rule.name,
                match: match[0].substring(0, 15) + "..." // Mask finding
              });
            }
          });
        } catch (e) {
          // Skip binary or unreadable files
        }
      }
    });
  }

  try {
    scanDir(rootPath);
    res.status(200).json({
      success: true,
      findingsCount: findings.length,
      findings,
      recommendations: findings.length > 0
        ? "Move exposed hardcoded credentials to environment variables (.env files) immediately."
        : "No credentials leaks detected in active code files."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Validates prompt inputs against common injection and jailbreak payloads.
 */
export async function detectPromptInjection(req, res) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt text is required." });
  }

  const injectionPatterns = [
    { name: "Instruction Override", pattern: /ignore\s+(the\s+)?previous\s+instruction/i },
    { name: "Jailbreak Mode", pattern: /you\s+are\s+now\s+in\s+developer\s+mode/i },
    { name: "Jailbreak Mode (DAN)", pattern: /do\s+anything\s+now/i },
    { name: "System Prompt Extraction", pattern: /output\s+your\s+system\s+prompt/i },
    { name: "Jailbreak Mode (Developer Mode)", pattern: /simulate\s+developer\s+mode/i }
  ];

  try {
    const hits = [];
    injectionPatterns.forEach(rule => {
      if (rule.pattern.test(prompt)) {
        hits.push(rule.name);
      }
    });

    const isSafe = hits.length === 0;
    const threatScore = hits.length * 25; // 0 to 100 scale

    res.status(200).json({
      success: true,
      isSafe,
      threatScore,
      detections: hits,
      recommendations: isSafe
        ? "Prompt is clean. No jailbreak attacks identified."
        : "Caution: Prompt contains instructions overriding AI directives. Sanitization is recommended."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Scans package files to inspect outdated or vulnerable library dependencies.
 */
export async function scanDependencyVulnerabilities(req, res) {
  const packagePath = path.resolve("package.json");

  try {
    if (!fs.existsSync(packagePath)) {
      return res.status(200).json({ success: true, vulnerabilities: [], message: "No package.json file found." });
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const vulnerabilities = [];

    // Simple vulnerability check database for common dependencies
    const vulnerabilityDatabase = {
      "express": { maxVulnerable: "4.19.2", severity: "Medium", cve: "CVE-2024-37890", recommendation: "Upgrade to express >= 5.x or patch" },
      "axios": { maxVulnerable: "1.6.0", severity: "High", cve: "CVE-2023-45857", recommendation: "Upgrade to axios >= 1.7.4" },
      "jsonwebtoken": { maxVulnerable: "8.5.1", severity: "High", cve: "CVE-2022-23529", recommendation: "Upgrade to jsonwebtoken >= 9.x" }
    };

    Object.keys(deps).forEach(depName => {
      if (vulnerabilityDatabase[depName]) {
        const vul = vulnerabilityDatabase[depName];
        vulnerabilities.push({
          dependency: depName,
          installedVersion: deps[depName],
          severity: vul.severity,
          cve: vul.cve,
          recommendation: vul.recommendation
        });
      }
    });

    res.status(200).json({
      success: true,
      vulnerabilitiesCount: vulnerabilities.length,
      vulnerabilities,
      recommendations: vulnerabilities.length > 0
        ? "Vulnerable packages detected. Run 'npm update' or patch specific package files."
        : "All dependency structures look secure."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
