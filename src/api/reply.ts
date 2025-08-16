import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const replyApi = {
    // 添加评论回复
    addReply: (data: object) => post('/reply/add', data),

    // 根据 ID 获取单条回复
    getReplyById: (id: number) => get(`/reply/byId/${id}`),
    getAllReplys: () => get('/reply/select/all'),
    // 获取指定评论下的所有回复
    getRepliesByCommentId: (commentId: number) => get(`/reply/byCommentId/${commentId}`),

    // 删除回复
    deleteReply: (id: number) => del(`/reply/delete/${id}`),

    // 更新回复内容
    updateReply: (id: number, content: string) => put(`/reply/update/${id}`, content)
};

export default replyApi;
