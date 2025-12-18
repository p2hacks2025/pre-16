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

  if (!text) {
    return { score: 0, label: "neutral" };
  }

  // OPTIMIZATION: Use Intl.Segmenter to tokenize text and look up words in O(1).
  // This is significantly faster than iterating the entire dictionary with Regex O(N).
  const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
  const segments = segmenter.segment(text);

  for (const segment of segments) {
    if (segment.isWordLike) {
      const word = segment.segment;
      if (dictionary[word]) {
        score += dictionary[word];
      }
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
