import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法
/*
    # Step 3: 根据遗忘曲线公式计算下次间隔
    # R(t) = exp(-t / S)
    # 需要 R(t) = 1 - FI
    # => t = -S * ln(1 - FI)
*/
const reviewLogApi = {
    // 创建新的复习状态
    addReviewLog: (data: object) => post('/api/reviewLogs', data),

    // 更新复习状态（普通更新）
    updateReviewLog: (data: object) => put('/api/reviewLogs', data),

    // 删除复习状态
    deleteReviewLog: (id: number) => del(`/api/reviewLogs/delete//${id}`),
    // 根据 userId 获取复习记录
    getReviewLogByUserId: (id: number) => get(`/api/reviewLogs/get/${id}`),
    // 获取所有复习记录
    getAllReviewLogs: () => get('/api/reviewLogs/get/all'),
};

export default reviewLogApi;
