export interface UserVideoAction {
    id?: number;

    userId: number;

    videoId: number;

    /**
     * 1 = 点赞
     * 2 = 收藏
     */
    actionType: number;

    /**
     * 1 = 有效（点赞/收藏）
     * 0 = 取消
     */
    state: number;

    createTime?: string;

    updateTime?: string;
}