import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法
/*
    # Step 3: 根据遗忘曲线公式计算下次间隔
    # R(t) = exp(-t / S)
    # 需要 R(t) = 1 - FI
    # => t = -S * ln(1 - FI)
*/
const reviewApi = {
    // 获取用户所有复习状态
    getAllReviews: (userId: number) => get(`/reviewState/read/user/${userId}`),

    // 获取某条复习状态
    getReviewById: (id: number) => get(`/reviewState/read/${id}`),

    // 获取用户到期复习列表
    getDueReviews: (userId: number) => get(`/reviewState/read/due/${userId}`),

    // 创建新的复习状态
    addReview: (data: object) => post('/reviewState/add', data),

    // 更新复习状态（普通更新）
    updateReview: (data: object) => put('/reviewState/update', data),

    // 删除复习状态
    deleteReview: (id: number) => del(`/reviewState/delete/${id}`),

    // 根据 SM-5 打分更新复习计划（score: 0-5）
    updateReviewByScore: (id: number, score: number) => put('/reviewState/score', { id, score })
};

export default reviewApi;
