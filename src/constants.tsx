import React from 'react';
import { ToolCategory } from './types';

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'writing', name: 'Writing', icon: '✍️', prompt: 'I want you to act as a creative writer. Help me write an essay, story, poetry, or script.' },
  { id: 'translation', name: 'Translation', icon: '🌐', prompt: 'I want you to act as a translator. Translate between English, Bangla, Hindi, and Korean.' },
  { id: 'study', name: 'Study Help', icon: '📚', prompt: 'I want you to act as a study assistant. Explain math formulas, SSC/HSC topics, or summarize text.' },
  { id: 'coding', name: 'Coding', icon: '💻', prompt: 'I want you to act as a senior developer. Help me with HTML, CSS, React, Python, and debugging.' },
  { id: 'calculation', name: 'Calculation', icon: '🔢', prompt: 'I want you to act as a calculator and data analyst. Help me with percentages, GPA, or income estimation.' },
  { id: 'social', name: 'Social Media', icon: '📱', prompt: 'I want you to act as a social media expert. Help me with YouTube SEO, growth tips, and monetization.' },
  { id: 'image', name: 'Image Help', icon: '🖼️', prompt: 'I want you to act as a design consultant. Help me with UI suggestions, image ratios, and descriptions.' },
];

export const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "ASK-GPT 2.5 pro (Auto)" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "ASK-GPT (Vision)" },
];

export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile";
export const IMAGE_FAST_MODEL_ID = "imagen-4-fast-generate";
export const IMAGE_MODEL_ID = "imagen-4-generate";
export const IMAGE_ULTRA_MODEL_ID = "imagen-4-ultra-generate";

export const HARD_MODEL_ID = "openai/gpt-oss-120b";
export const VERY_HARD_MODEL_ID = "openai/gpt-oss-120b";
