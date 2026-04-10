// utils/sm2.
/*
If quality >= 3:
    If repetition = 1:
        interval = 1
    Else if repetition = 2:
        interval = 6
    Else:
        interval = interval * EF
    EF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if EF < 1.3: EF = 1.3
Else:
    repetition = 0
    interval = 1

*/
export function sm2Update(reviewState : any, score : number) {
  // score: 用户评分 (0~5)，例如: 5=非常熟悉，0=完全忘记

    let {
        intervalDays,
        ef,
        repetitions
    } = reviewState
    // 确保质量评分在0-5范围内
    score = Math.max(0, Math.min(5, score));
    // EF更新
    ef = ef + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    ef = Math.max(1.3, ef);

    if (score >= 3) {
      // 成功记忆，增加重复次数
      repetitions = repetitions + 1;

      if (repetitions === 1) intervalDays = 1;
      else if (repetitions === 2) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * ef);
    } else {
      // 记忆失败，重置重复次数
      repetitions = 0;
      intervalDays = 1;
    }
  return {
    ...reviewState,
    intervalDays,
    ef,
    repetitions
  }
}
