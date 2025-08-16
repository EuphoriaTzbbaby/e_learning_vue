import { get, post, put, del } from '../utils/axios';

const videoAlbumApi = {
  // 获取所有视频合集
  getAllAlbums: () => get('/videoAlbum/select/all', {}),
  getAlbumsBySelectVal: (selectVal: string) => get(`/videoAlbum/select/selectBySelectVal/${selectVal}`),
  getAlbumByAlbumId: (id: number) => get(`/videoAlbum/select/${id}`),
  // 创建视频合集
  addAlbum: (data: object) => post('/videoAlbum/insert', data),

  // 更新视频合集
  updateAlbum: (data: object) => put('/videoAlbum/update', data),

  // 删除视频合集
  deleteAlbum: (id: number) => del(`/videoAlbum/delete/${id}`),
};

export default videoAlbumApi;