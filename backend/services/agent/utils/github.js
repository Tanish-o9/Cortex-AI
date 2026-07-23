import { Octokit } from "@octokit/rest";

/**
 * Creates an Octokit instance with user token.
 */
function getOctokit(token) {
  if (!token || token.startsWith("mock")) {
    return null;
  }
  return new Octokit({ auth: token });
}

/**
 * Creates an issue in a GitHub repository.
 */
export async function createGitHubIssue(token, owner, repo, title, body) {
  const octokit = getOctokit(token);
  if (!octokit) {
    console.log(`[GitHub Mock] Creating issue in ${owner}/${repo}: "${title}"`);
    return { success: true, mock: true, issueNumber: Math.floor(Math.random() * 100) };
  }

  try {
    const response = await octokit.issues.create({
      owner,
      repo,
      title,
      body
    });
    return { success: true, issueNumber: response.data.number, url: response.data.html_url };
  } catch (err) {
    console.error("❌ Failed to create GitHub issue:", err.message);
    throw err;
  }
}

/**
 * Creates a commit with file modifications on a branch.
 */
export async function createGitHubCommit(token, owner, repo, branch, path, content, message) {
  const octokit = getOctokit(token);
  if (!octokit) {
    console.log(`[GitHub Mock] Committing to ${owner}/${repo} on branch [${branch}]: File [${path}]`);
    return { success: true, mock: true, sha: "mock_commit_sha_12345" };
  }

  try {
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = data.sha;
    } catch (e) {
      // File doesn't exist, which is fine
    }

    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      sha
    });

    return { success: true, sha: response.data.commit.sha };
  } catch (err) {
    console.error("❌ Failed to create GitHub commit:", err.message);
    throw err;
  }
}

/**
 * Creates a Pull Request.
 */
export async function createGitHubPR(token, owner, repo, head, base, title, body) {
  const octokit = getOctokit(token);
  if (!octokit) {
    console.log(`[GitHub Mock] Opening PR in ${owner}/${repo} from ${head} into ${base}`);
    return { success: true, mock: true, prNumber: Math.floor(Math.random() * 100) };
  }

  try {
    const response = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body
    });
    return { success: true, prNumber: response.data.number, url: response.data.html_url };
  } catch (err) {
    console.error("❌ Failed to create GitHub PR:", err.message);
    throw err;
  }
}
