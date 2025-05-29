import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const videoApi = {
    // 获取所有视频
    getAllVideos: () => get('/video/select/all'),
    getVideosByAlbumId: (id: number) => get(`/video/select/byAlbumId/${id}`),
    getVideosBySelectVal: (selectVal: string) => get(`/video/select/selectBySelectVal/${selectVal}`),
    // 创建视频
    addVideo: (data: object) => post('/video/insert', data),

    // 更新视频
    updateVideo: (data: object) => put('/video/update', data),

    // 删除视频
    deleteVideo: (id: number) => del(`/video/delete/${id}`),
};

export default videoApi;
