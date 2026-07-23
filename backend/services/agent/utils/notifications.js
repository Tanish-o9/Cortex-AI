import axios from "axios";

/**
 * Sends a notification message to a Slack Webhook.
 * 
 * @param {string} webhookUrl 
 * @param {string} message 
 * @param {string} title 
 */
export async function sendSlackNotification(webhookUrl, message, title = "Cortex AI Notification") {
  if (!webhookUrl || webhookUrl.startsWith("mock")) {
    console.log(`[Notification Mock] Slack: [${title}] ${message}`);
    return { success: true, mock: true };
  }

  try {
    await axios.post(webhookUrl, {
      text: `*${title}*\n${message}`,
      mrkdwn: true
    });
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to send Slack notification:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a notification message to a Discord Webhook.
 * 
 * @param {string} webhookUrl 
 * @param {string} message 
 * @param {string} username 
 */
export async function sendDiscordNotification(webhookUrl, message, username = "Cortex AI Bot") {
  if (!webhookUrl || webhookUrl.startsWith("mock")) {
    console.log(`[Notification Mock] Discord: [${username}] ${message}`);
    return { success: true, mock: true };
  }

  try {
    await axios.post(webhookUrl, {
      content: message,
      username
    });
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to send Discord notification:", err.message);
    return { success: false, error: err.message };
  }
}
