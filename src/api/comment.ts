import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const commentApi = {
    // 获取所有评论
    getAllComments: () => get('/comment/select/all'),

    // 创建评论
    addComment: (data: object) => post('/comment/add', data),

    // 更新评论
    updateComment: (data: object) => put('/comment/update', data),

    // 删除评论
    deleteComment: (id: number) => del(`/comment/${id}`),

    // 根据评论 ID 获取评论
    getCommentById: (id: number) => get(`/comment/${id}`),

    // 获取指定视频下的所有评论
    getCommentsByVideoId: (videoId: number) => get(`/comment/video/${videoId}`)
};

export default commentApi;
