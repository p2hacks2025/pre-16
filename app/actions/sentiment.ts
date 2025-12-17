"use server";

import fs from "fs";
import path from "path";

// Dictionary cache to avoid reading file on every request
let sentimentDictionary: Record<string, number> | null = null;

const DATA_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "pn.csv.m3.120408.trim"
);

async function loadDictionary() {
  if (sentimentDictionary) return sentimentDictionary;

  try {
    const fileContent = await fs.promises.readFile(DATA_FILE_PATH, "utf-8");
    const lines = fileContent.split("\n");
    const dictionary: Record<string, number> = {};

    for (const line of lines) {
      if (!line.trim()) continue;
      // Format: word <tab> sentiment <tab> ...
      const parts = line.split("\t");
      if (parts.length >= 2) {
        const word = parts[0];
        const label = parts[1]; // 'p', 'n', 'e'

        if (label === "p") {
          dictionary[word] = 1;
        } else if (label === "n") {
          dictionary[word] = -1;
        } else {
          // 'e' or others are neutral, ignore or 0
          // dictionary[word] = 0;
        }
      }
    }
    sentimentDictionary = dictionary;
    return dictionary;
  } catch (error) {
    console.error("Failed to load sentiment dictionary:", error);
    // Return empty if file missing (should not happen in prod if verified)
    return {};
  }
}

export type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentimentAction(
  text: string
): Promise<SentimentResult> {
  const dictionary = await loadDictionary();
  let score = 0;

  // Simple string matching.
  // Note: This matches anywhere in the string.
  // Ideally, one would use a tokenizer (like Kuromoji.js or MeCab) but that requires more setup.
  // For a basic implementation as requested, we iterate through keys.
  // OPTIMIZATION: Iterating through a large dictionary for every request is slow.
  // However, given the constraints and "no tokenizer", checking if `text.includes(word)` for all polarized words is one way.
  // To make it slightly faster, we can just scan the text? No, Japanese text has no spaces.
  // We will iterate dictionary keys.

  if (!text) {
    return { score: 0, label: "positive" };
  }

  for (const [word, value] of Object.entries(dictionary)) {
    // If the word is in the text, add its value matches count times?
    // text.includes(word) is simplest.
    // Issues: "happy" might be inside "unhappy" (in English). In Japanese less likely to be false positive inverse, but possible.
    // We will do a simple inclusion check.

    // Count occurrences
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"); // escape regex chars
    const matches = text.match(regex);
    if (matches) {
      score += value * matches.length;
    }
  }

  // Force classification as requested
  let label: "positive" | "negative" | "neutral" = "neutral";

  if (score < 0) {
    label = "negative";
  } else if (score > 0) {
    label = "positive";
  } else {
    label = "neutral";
  }

  return { score, label };
}
