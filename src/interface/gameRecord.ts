// src/types/gameRecord.ts

export interface GameRecord {
    recordId: number;      // 游戏记录唯一编号
    userId: number;        // 用户ID
    createTime: string;    // 创建时间，ISO 格式字符串
    difficulty: number;    // 难度等级
    result: 'win' | 'lose'; // 胜利/失败
}