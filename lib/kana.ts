import type { Attempt } from "./types";
import { WORDS, type KanaWord } from "./words";

const ROMAJI: Record<string, string> = {
  あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",ら:"ra",り:"ri",
  る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"wo",ん:"n",が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",
  ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",
  ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
  きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sha",しゅ:"shu",しょ:"sho",ちゃ:"cha",ちゅ:"chu",ちょ:"cho",
  にゃ:"nya",にゅ:"nyu",にょ:"nyo",ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",
  りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",じゃ:"ja",じゅ:"ju",じょ:"jo",
  びゃ:"bya",びゅ:"byu",びょ:"byo",ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo",
};

export const RECENT_SUCCESS_WINDOW = 24;

export function recentSuccessfulKana(attempts: Attempt[]) {
  const kana = new Set<string>();
  let successes = 0;
  for (const attempt of attempts) {
    if (!attempt.correct) continue;
    kana.add(attempt.kana);
    successes++;
    if (successes === RECENT_SUCCESS_WINDOW) break;
  }
  return kana;
}

export type KanaResult = { kana: string; correct: boolean };

function units(kana: string) {
  const output: { kana: string; romaji: string; start: number; end: number }[] = [];
  let romajiIndex = 0;
  for (let index = 0; index < kana.length; index++) {
    const char = kana[index];
    if (char === "っ") {
      const nextPair = kana.slice(index + 1, index + 3);
      const next = ROMAJI[nextPair] || ROMAJI[kana[index + 1]] || "";
      const value = next[0] || "";
      output.push({ kana: char, romaji: value, start: romajiIndex, end: romajiIndex + value.length });
      romajiIndex += value.length;
      continue;
    }
    const pair = kana.slice(index, index + 2);
    const value = ROMAJI[pair] || ROMAJI[char] || "";
    const label = ROMAJI[pair] ? pair : char;
    if (label.length === 2) index++;
    output.push({ kana: label, romaji: value, start: romajiIndex, end: romajiIndex + value.length });
    romajiIndex += value.length;
  }
  return output;
}

function wrongExpectedIndexes(expected: string, answer: string) {
  const rows = expected.length + 1; const cols = answer.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) for (let j = 1; j < cols; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (expected[i - 1] === answer[j - 1] ? 0 : 1));
  }
  const wrong = new Set<number>(); let i = expected.length; let j = answer.length;
  while (i || j) {
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + (expected[i - 1] === answer[j - 1] ? 0 : 1)) {
      if (expected[i - 1] !== answer[j - 1]) wrong.add(i - 1); i--; j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) { wrong.add(i - 1); i--; }
    else { if (i) wrong.add(Math.max(0, i - 1)); j--; }
  }
  return wrong;
}

export function kanaBreakdown(kana: string, expected: string, answer: string): KanaResult[] {
  const wrong = wrongExpectedIndexes(expected, answer);
  return units(kana).map((unit) => ({
    kana: unit.kana,
    correct: Array.from({ length: Math.max(1, unit.end - unit.start) }, (_, offset) => unit.start + offset).every((index) => !wrong.has(index)),
  }));
}

export function kanaMastery(attempts: Attempt[]) {
  const map = new Map<string, { kana: string; hits: number; misses: number }>();
  for (const attempt of attempts) {
    const breakdown = attempt.kanaBreakdown?.length ? attempt.kanaBreakdown : Array.from(attempt.kana).map((kana) => ({ kana, correct: attempt.correct }));
    for (const result of breakdown) {
      const row = map.get(result.kana) || { kana: result.kana, hits: 0, misses: 0 };
      if (result.correct) row.hits++;
      else row.misses++;
      map.set(result.kana, row);
    }
  }
  return Array.from(map.values()).map((row) => ({ ...row, accuracy: row.hits / (row.hits + row.misses) * 100 })).sort((a, b) => a.accuracy - b.accuracy || b.misses - a.misses);
}

export function adaptiveWord(attempts: Attempt[], except?: string): KanaWord {
  const recentSuccesses = recentSuccessfulKana(attempts);
  const freshCandidates = WORDS.filter((word) => word.kana !== except && !recentSuccesses.has(word.kana));
  const candidates = freshCandidates.length ? freshCandidates : WORDS.filter((word) => word.kana !== except);
  if (attempts.length < 3 || Math.random() < .25) return candidates[Math.floor(Math.random() * candidates.length)];
  const mastery = kanaMastery(attempts);
  const missRate = new Map(mastery.map((item) => [item.kana, 1 - item.accuracy / 100]));
  const weighted = candidates.map((word) => ({ word, weight: 1 + units(word.kana).reduce((sum, unit) => sum + (missRate.get(unit.kana) || 0) * 5, 0) }));
  let cursor = Math.random() * weighted.reduce((sum, item) => sum + item.weight, 0);
  for (const item of weighted) { cursor -= item.weight; if (cursor <= 0) return item.word; }
  return weighted[weighted.length - 1].word;
}
