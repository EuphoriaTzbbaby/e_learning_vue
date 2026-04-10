export interface UserActionLog {
    /**
     * 主键ID
     */
    id?: number;

    /**
     * 用户ID
     */
    userId: number;

    /**
     * 操作类型（LOGIN / LIKE / DELETE / UPDATE 等）
     */
    actionType: string;

    /**
     * 操作内容描述
     */
    actionContent?: string;

    /**
     * 操作时间
     */
    actionTime?: string;
}