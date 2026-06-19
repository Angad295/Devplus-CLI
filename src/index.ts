#!/usr/bin/env node
import { Command } from "commander";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import inquirer from "inquirer";
import fs from "fs";

const program = new Command();
const ai = new GoogleGenAI({});

// For model flexibility
const TARGET_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

program
  .name("devpulse")
  .description("AI-powered developer productivity tool")
  .version("1.0.0");

// ==========================================
// 1. COMMIT COMMAND
// ==========================================
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
        model: TARGET_MODEL,
        contents: `Write 3 concise, conventional commit messages for this git diff. 
                   Return ONLY the 3 messages, one on each line, with no extra formatting, no markdown, and no bullet points.
                   
                   Diff:
                   ${diff}`,
      });

      // Parse the response into an array of strings
      const messages = (response.text || "")
        .split("\n")
        .map((msg) => msg.trim())
        .filter((msg) => msg.length > 0);

      // Create the interactive menu
      const answer = await inquirer.prompt([
        {
          type: "select",
          name: "selectedMessage",
          message: "Select a commit message to use:",
          choices: [...messages, new inquirer.Separator(), "Cancel"],
        },
      ]);

      if (answer.selectedMessage === "Cancel") {
        console.log("❌ Commit cancelled.");
        return;
      }

      // Execute the real Git commit
      execSync(`git commit -m "${answer.selectedMessage}"`);
      console.log(`\n✅ Successfully committed: "${answer.selectedMessage}"`);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  });

// ==========================================
// 2. REVIEW COMMAND
// ==========================================
program
  .command("review")
  .description("Get an AI code review for your last commit")
  .action(async () => {
    try {
      // Get the diff of the last commit relative to its parent
      const diff = execSync("git diff HEAD~1").toString();

      if (!diff) {
        console.log("⚠️ No changes found in the last commit.");
        return;
      }

      console.log("🧐 Reviewing last commit with Gemini...");

      const response = await ai.models.generateContent({
        model: TARGET_MODEL,
        contents: `Review this git diff from the last commit. Provide a short, constructive code review. 
                   Highlight potential bugs, code quality improvements, or praise good practices.
                   Keep it concise and format it cleanly for a terminal.
                   
                   Diff:
                   ${diff}`,
      });

      console.log("\n✨ AI Code Review:");
      console.log(response.text);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  });

// ==========================================
// 3. CHANGELOG COMMAND
// ==========================================
program
  .command("changelog")
  .description("Auto-generate a CHANGELOG.md from git history")
  .action(async () => {
    try {
      // Grab the last 10 commit messages
      const log = execSync("git log -n 10 --oneline").toString();

      if (!log) {
        console.log("⚠️ No commit history found.");
        return;
      }

      console.log("📜 Generating changelog with Gemini...");

      const response = await ai.models.generateContent({
        model: TARGET_MODEL,
        contents: `Convert these git commits into a clean, professional Markdown changelog. 
                   Group them logically (e.g., Features, Fixes, Chores) if possible.
                   
                   Commits:
                   ${log}`,
      });

      const changelogContent = response.text || "";

      // Write to CHANGELOG.md in the current directory
      fs.writeFileSync("CHANGELOG.md", changelogContent);

      console.log("\n✅ CHANGELOG.md generated successfully!");
    } catch (error) {
      console.error("❌ Error:", error);
    }
  });

program.parse(process.argv);
