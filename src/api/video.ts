import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const videoApi = {
    // 获取所有视频
    getAllVideos: (albumId: number) => get('/video/select/all', { albumId }),

    // 创建视频
    createVideo: (data: object) => post('/video/insert', data),

    // 更新视频
    updateVideo: (data: object) => put('/video/update', data),

    // 删除视频
    deleteVideo: (id: number) => del(`/video/delete/${id}`),
};

export default videoApi;
