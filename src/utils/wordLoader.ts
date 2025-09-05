// @/utils/wordLoader.ts
/**
 * 单词和释义的接口
 */
export interface WordItem {
  word: string;
  meaning: string;
}
/**
 * 从txt文件加载考研英语大纲单词
 * @returns {Promise<WordItem[]>} 单词数组
 */
export async function loadGraduateWords(): Promise<WordItem[]> {
  try {
    // 使用根路径访问 public 目录下的文件
    const response = await fetch('/考研-乱序.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 检查响应类型是否为文本
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/plain')) {
      console.error('Expected text/plain but got:', contentType);
      throw new Error('Response is not plain text');
    }
    // 克隆响应以避免"body stream already read"错误
    const text = await response.clone().text();
    // 检查返回的内容是否是HTML（表示路径错误）
    if (text.trim().startsWith('<!doctype html>') || text.trim().startsWith('<!DOCTYPE html>')) {
      console.error('Received HTML instead of text file. Check if the file exists in public directory.');
      throw new Error('Received HTML instead of text file');
    }
    const lines = text.split('\n');
    const words: WordItem[] = [];
    for (const line of lines) {
      // 跳过空行
      if (!line.trim()) continue;
      // 使用制表符或多个空格分割单词和释义
      const parts = line.split(/\t+/);
      if (parts.length < 2) continue;
      const word = parts[0].trim().toLowerCase(); // 转换为小写
      const meaning = parts.slice(1).join('\t').trim();
      if (word && meaning) {
        words.push({ word, meaning });
      }
    }
    console.log(`成功加载 ${words.length} 个单词`);
    return words;
  } catch (error) {
    console.error('Error loading words:', error);
    // 如果从文件加载失败，尝试使用内置的默认单词列表
    console.log('使用默认单词列表作为备用');
    return getDefaultWords();
  }
}
/**
 * 获取默认单词列表（作为备用）
 * @returns {WordItem[]} 默认单词列表
 */
function getDefaultWords(): WordItem[] {
  return [
    { word: "revolt", meaning: "n. 反抗；造反，起义 v. 起义；反抗" },
    { word: "specialist", meaning: "n. 专家" },
    { word: "carpet", meaning: "n. 地毯" },
    { word: "meditation", meaning: "n. 默想，冥想；沉思，深思，思考" },
    { word: "persist", meaning: "v. 坚持；执意；继续存在[发生]；持续" },
    { word: "avoid", meaning: "v. 防止，避免；逃避，避开" },
    { word: "yellow", meaning: "adj. 黄的，黄色的 n. 黄色" },
    { word: "consult", meaning: "v. 请教，向...咨询；找...商量；查阅，查看" },
    { word: "assume", meaning: "v. 假定，设想；开始掌管/承担责任等；假装[装出]…的态度/样子/表情等" },
    { word: "doctorate", meaning: "n. 博士学位;博士头衔" },
    { word: "resultant", meaning: "adj. 作为结果而发生的" },
    { word: "fuse", meaning: "n. 保险丝；导火线,引信 v. 结合; 融合; 熔合" },
    { word: "very", meaning: "adv. 很，非常；完全 adj. 同一的，正是的，恰好的这样的" },
    // 可以继续添加更多单词...
  ];
}
/**
 * 根据难度过滤单词
 * @param {WordItem[]} words 单词数组
 * @param {string} difficulty 难度级别
 * @returns {string[]} 过滤后的单词数组（小写）
 */
export function filterWordsByDifficulty(words: WordItem[], difficulty: string): string[] {
  let wordLength: number;
  switch (difficulty) {
    case 'easy':
      wordLength = 4;
      break;
    case 'medium':
      wordLength = 5;
      break;
    case 'hard':
      wordLength = 6;
      break;
    default:
      wordLength = 5;
  }
  const filteredWords = words
    .filter(item => item.word.length === wordLength)
    .map(item => item.word); // 保持小写
  console.log(`难度 ${difficulty} (${wordLength}字母) 过滤后有 ${filteredWords.length} 个单词`);
  return filteredWords;
}