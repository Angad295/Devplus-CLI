#!/usr/bin/env node
import { Command } from "commander";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";

const program = new Command();
const ai = new GoogleGenAI({});

program
  .name("devpulse")
  .description("AI-powered developer productivity tool")
  .version("1.0.0");

program
  .command("commit")
  .description("Generate a smart commit message from staged changes")
  .action(async () => {
    try {
      // 1. Get the staged git diff
      const diff = execSync("git diff --staged").toString();

      if (!diff) {
        console.log("⚠️ No staged changes found. Run `git add` first.");
        return;
      }

      console.log("🧠 Analyzing diff with Gemini...");

      // 2. Send to Gemini 2.5 Flash (the fastest model for this task)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write 3 concise, conventional commit messages for this git diff. 
                   Return ONLY the 3 messages, one on each line, with no extra formatting or markdown.
                   
                   Diff:
                   ${diff}`,
      });

      // 3. Print the results
      console.log("\n✨ Suggested Commit Messages:");
      console.log(response.text);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  });

program.parse(process.argv);
