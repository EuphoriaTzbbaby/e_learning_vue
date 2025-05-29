import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const courseNoticeApi = {
  // 新增公告
  addNotice: (data: object) => post('/courseNotice/add', data),

  // 删除公告
  deleteNotice: (id: number) => del(`/courseNotice/delete/${id}`),

  // 更新公告
  updateNotice: (data: object) => put('/courseNotice/update', data),

  // 获取单个公告
  getNoticeById: (id: number) => get(`/courseNotice/get/${id}`),

  // 获取所有公告
  getAllNotices: () => get('/courseNotice/list'),
};

export default courseNoticeApi;
