"use server";

import fs from "fs";
import path from "path";
import kuromoji from "kuromoji";

// Cache to avoid re-initializing on every request
let sentimentDictionary: Record<string, number> | null = null;
let tokenizerInstance: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;
let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;

const DATA_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "pn.csv.m3.120408.trim"
);

// Initialize Kuromoji tokenizer (cached)
async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizerInstance) return tokenizerInstance;
  
  // Prevent multiple simultaneous initializations
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
        if (err) {
          console.error("Failed to initialize Kuromoji tokenizer:", err);
          reject(err);
        } else {
          tokenizerInstance = tokenizer;
          resolve(tokenizer);
        }
      });
    });
  }
  
  return tokenizerPromise;
}

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
        }
        // Ignore neutral ('e') words to reduce dictionary size
      }
    }
    sentimentDictionary = dictionary;
    console.log(`Loaded sentiment dictionary with ${Object.keys(dictionary).length} words`);
    return dictionary;
  } catch (error) {
    console.error("Failed to load sentiment dictionary:", error);
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
  // Early return for empty text
  if (!text || !text.trim()) {
    return { score: 0, label: "neutral" };
  }

  try {
    const [dictionary, tokenizer] = await Promise.all([
      loadDictionary(),
      getTokenizer()
    ]);

    // Tokenize Japanese text using Kuromoji
    const tokens = tokenizer.tokenize(text);
    let score = 0;

    // Check each token's surface form and base form against dictionary
    for (const token of tokens) {
      const surface = token.surface_form;
      const baseForm = token.basic_form;

      // Check surface form first (exact match)
      if (dictionary[surface] !== undefined) {
        score += dictionary[surface];
      }
      // If different, also check base form (e.g., conjugated verbs)
      else if (baseForm !== surface && dictionary[baseForm] !== undefined) {
        score += dictionary[baseForm];
      }
    }

    // Classify sentiment based on score
    let label: "positive" | "negative" | "neutral" = "neutral";

    if (score < 0) {
      label = "negative";
    } else if (score > 0) {
      label = "positive";
    }

    return { score, label };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    // Fallback to neutral on error
    return { score: 0, label: "neutral" };
  }
}
