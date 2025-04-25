
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import OpenAI from "jsr:@openai/openai";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
} as const;

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { task } = await req.json();

    const prompt = `
Task title: ${task.title}
Description: ${task.description}
Status: ${task.status}

Suggest the next best step in two concise sentences, then add one creative twist.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an agile coach." },
        { role: "user", content: prompt },
      ],
      max_tokens: 120,
    });

    return new Response(
      JSON.stringify({ suggestion: completion.choices[0].message.content }),
      {
        headers: {
          ...cors,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "AI suggestion failed" }),
      {
        status: 500,
        headers: {
          ...cors,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
