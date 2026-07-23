import redis from "../../../shared/redis/redis.js";
import { graph } from "../graph/supervisor.graph.js";
import { addMessage, getMemory } from "../utils/memory.js";
import { getModel } from "../utils/model.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import axios from "axios";

export const chat = async (req, res, next) => {
  try {
    const { prompt, conversationId, agent, stream } = req.body;

    console.log("Chat Request received:", req.body);

    if (stream) {
      // 1. Set Server-Sent Events headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // 2. Save User message to memory & database
      await addMessage(conversationId, "user", prompt);
      await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
        conversationId,
        role: "user",
        content: prompt
      });

      // 3. Resolve the active agent and its model
      const activeAgent = agent || "chat";
      const model = getModel(activeAgent);

      // 4. Retrieve conversation history context
      const history = await getMemory(conversationId);
      const messages = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg) => {
          if (msg.role === "user") {
            messages.push(new HumanMessage(msg.content));
          } else {
            messages.push(new AIMessage(msg.content));
          }
        });
      }

      // If history is empty, make sure the current prompt is present
      if (!messages.some(m => m.content === prompt)) {
        messages.push(new HumanMessage(prompt));
      }

      // 5. Stream response chunk-by-chunk to the client
      let fullAnswer = "";
      try {
        const tokenStream = await model.stream(messages);
        for await (const chunk of tokenStream) {
          const chunkText = chunk.content || chunk.text || chunk || "";
          fullAnswer += chunkText;
          res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
        }
      } catch (err) {
        console.error("Stream generation error:", err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }

      // 6. Save Assistant response to memory & database
      if (fullAnswer) {
        await addMessage(conversationId, "assistant", fullAnswer);
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
          conversationId,
          role: "assistant",
          content: fullAnswer
        });
      }

      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // Non-streaming fallback
    await addMessage(conversationId, "user", prompt);
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "user",
      content: prompt
    });

    const result = await graph.invoke({
      prompt,
      conversationId,
      userId: req.headers["x-user-id"],
      agent,
      file: req.file
    });

    console.log("after res", result);

    await addMessage(conversationId, "assistant", result.response);
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "assistant",
      content: result.response,
      images: result.images,
      artifacts: result.artifacts || []
    });

    return res.json({
      success: true,
      answer: result.response,
      images: result.images,
      artifacts: result.artifacts || []
    });

  } catch (error) {
    next(error);
  }
};