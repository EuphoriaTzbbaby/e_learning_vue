// utils/sm5.
export function sm5Update(reviewState : any, score : number) {
  // score: 用户评分 (0~5)，例如: 5=非常熟悉，0=完全忘记

    let {
        intervalDays,
        strength, // 0.1 ～ 5
        difficulty, // 0.1 ～ 1
        forgettingIdx, // 0 ～ 1
        repetitions
    } = reviewState
    // 确保质量评分在0-5范围内
    score = Math.max(0, Math.min(5, score));
    
    // 更新重复次数
    repetitions = (repetitions || 0) + 1;
    
    // 更新记忆强度
    if (score >= 3) {
        // 回答质量好，增加强度
        strength = strength + 0.1 * (score - 2.5);
    } else {
        // 回答质量差，减少强度
        strength = strength - 0.2 * (2.5 - score);
    }
    
    // 确保强度在合理范围内
    strength = Math.max(0.1, Math.min(5, strength));
    
    // 更新难度
    difficulty = difficulty + 0.1 * (score - 2.5);
    difficulty = Math.max(0.1, Math.min(1, difficulty));
    
    // 更新遗忘指数
    forgettingIdx = forgettingIdx + 0.05 * (score - 2.5);
    forgettingIdx = Math.max(0, Math.min(1, forgettingIdx));
    
    // 计算新的间隔天数
    if (repetitions === 1) {
        intervalDays = 1;
    } else if (repetitions === 2) {
        intervalDays = 3;
    } else {
        // SM-5算法的核心公式
        intervalDays = Math.round(
        intervalDays * 
        (1 + (strength - 1) * (1 - difficulty) * (1 - forgettingIdx))
        );
    }
  return {
    ...reviewState,
    intervalDays,
    strength,
    difficulty,
    forgettingIdx,
    repetitions
  }
}
