export type KanaWord = {
  kana: string;
  romaji: string;
  alternatives?: string[];
  translation: string;
};

export const WORDS: KanaWord[] = [
  { kana: "あさ", romaji: "asa", translation: "morning" },
  { kana: "いえ", romaji: "ie", translation: "house" },
  { kana: "うみ", romaji: "umi", translation: "sea" },
  { kana: "えき", romaji: "eki", translation: "station" },
  { kana: "おと", romaji: "oto", translation: "sound" },
  { kana: "かお", romaji: "kao", translation: "face" },
  { kana: "きた", romaji: "kita", translation: "north" },
  { kana: "くも", romaji: "kumo", translation: "cloud" },
  { kana: "けさ", romaji: "kesa", translation: "this morning" },
  { kana: "こころ", romaji: "kokoro", translation: "heart" },
  { kana: "さかな", romaji: "sakana", translation: "fish" },
  { kana: "しお", romaji: "shio", alternatives: ["sio"], translation: "salt" },
  { kana: "すし", romaji: "sushi", alternatives: ["susi"], translation: "sushi" },
  { kana: "せかい", romaji: "sekai", translation: "world" },
  { kana: "そら", romaji: "sora", translation: "sky" },
  { kana: "たまご", romaji: "tamago", translation: "egg" },
  { kana: "ちず", romaji: "chizu", alternatives: ["tizu"], translation: "map" },
  { kana: "つき", romaji: "tsuki", alternatives: ["tuki"], translation: "moon" },
  { kana: "てがみ", romaji: "tegami", translation: "letter" },
  { kana: "とけい", romaji: "tokei", translation: "clock" },
  { kana: "なつ", romaji: "natsu", alternatives: ["natu"], translation: "summer" },
  { kana: "にく", romaji: "niku", translation: "meat" },
  { kana: "ぬの", romaji: "nuno", translation: "cloth" },
  { kana: "ねこ", romaji: "neko", translation: "cat" },
  { kana: "のり", romaji: "nori", translation: "seaweed" },
  { kana: "はな", romaji: "hana", translation: "flower" },
  { kana: "ひかり", romaji: "hikari", translation: "light" },
  { kana: "ふゆ", romaji: "fuyu", alternatives: ["huyu"], translation: "winter" },
  { kana: "へや", romaji: "heya", translation: "room" },
  { kana: "ほし", romaji: "hoshi", alternatives: ["hosi"], translation: "star" },
  { kana: "まど", romaji: "mado", translation: "window" },
  { kana: "みず", romaji: "mizu", translation: "water" },
  { kana: "むし", romaji: "mushi", alternatives: ["musi"], translation: "insect" },
  { kana: "め", romaji: "me", translation: "eye" },
  { kana: "もり", romaji: "mori", translation: "forest" },
  { kana: "やま", romaji: "yama", translation: "mountain" },
  { kana: "ゆき", romaji: "yuki", translation: "snow" },
  { kana: "よる", romaji: "yoru", translation: "night" },
  { kana: "らいねん", romaji: "rainen", translation: "next year" },
  { kana: "りんご", romaji: "ringo", translation: "apple" },
  { kana: "るす", romaji: "rusu", translation: "absence" },
  { kana: "れきし", romaji: "rekishi", alternatives: ["rekisi"], translation: "history" },
  { kana: "ろく", romaji: "roku", translation: "six" },
  { kana: "わたし", romaji: "watashi", alternatives: ["watasi"], translation: "I / me" },
  { kana: "ほん", romaji: "hon", translation: "book" },
  { kana: "でんしゃ", romaji: "densha", translation: "train" },
  { kana: "きょう", romaji: "kyou", translation: "today" },
  { kana: "がっこう", romaji: "gakkou", translation: "school" },
  { kana: "りょこう", romaji: "ryokou", translation: "travel" },
  { kana: "ちょっと", romaji: "chotto", alternatives: ["tyotto"], translation: "a little" },
  { kana: "おちゃ", romaji: "ocha", translation: "tea" },
  { kana: "しゃしん", romaji: "shashin", alternatives: ["syasin"], translation: "photograph" },
];

export function randomWord(except?: string) {
  const candidates = except ? WORDS.filter((word) => word.kana !== except) : WORDS;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
