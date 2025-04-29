import { get, post, put, del } from '../utils/axios';

const videoAlbumApi = {
  // 获取所有视频合集
  getAllAlbums: () => get('/videoAlbum/select/all', {}),

  // 创建视频合集
  createAlbum: (data: object) => post('/videoAlbum/insert', data),

  // 更新视频合集
  updateAlbum: (data: object) => put('/videoAlbum/update', data),

  // 删除视频合集
  deleteAlbum: (id: number) => del(`/videoAlbum/delete/${id}`),
};

export default videoAlbumApi;
