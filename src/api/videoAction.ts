import { get, post, put} from '../utils/axios';

const videoActionApi = {
    // ================== 点赞 / 收藏 ==================

    /**
     * 保存（点赞 / 收藏 / 取消统一入口）
     */
    saveAction: (data: object) =>
        post('/video/action/save', data),

    /**
     * 修改状态（取消/恢复）
     */
    updateState: (data: object) =>
        put('/video/action/state', data),

    // ================== 查询 ==================

    /**
     * 查询单条行为记录
     */
    getOne: (userId: number, videoId: number, actionType: number) =>
        get('/video/action/one', { userId, videoId, actionType }),

    /**
     * 是否已点赞/收藏
     */
    isActive: (userId: number, videoId: number, actionType: number) =>
        get('/video/action/active', { userId, videoId, actionType }),

    /**
     * 查询用户对某个视频的所有行为
     */
    getByUserAndVideo: (userId: number, videoId: number) =>
        get('/video/action/user/video', { userId, videoId }),

    /**
     * 用户点赞的视频列表
     */
    getLikedVideos: (userId: number) =>
        get(`/video/action/user/${userId}/liked`),

    /**
     * 用户收藏的视频列表
     */
    getFavoritedVideos: (userId: number) =>
        get(`/video/action/user/${userId}/favorited`),

    // ================== 统计 ==================

    /**
     * 视频点赞数
     */
    getLikeCount: (videoId: number) =>
        get(`/video/action/video/${videoId}/likes`),

    /**
     * 视频收藏数
     */
    getFavoriteCount: (videoId: number) =>
        get(`/video/action/video/${videoId}/favorites`),

    // ================== 删除 ==================

    /**
     * 删除行为记录（不常用）
     */
    // deleteAction: (userId: number, videoId: number, actionType: number) =>
    //     del('/video/action', { userId, videoId, actionType }),
};

export default videoActionApi;