import { get, post, put, del } from '../utils/axios';

const userActionLogApi = {

    // ================== 新增日志 ==================

    /**
     * 新增用户操作日志
     */
    addLog: (data: object) =>
        post('/log/add', data),

    // ================== 删除 ==================

    /**
     * 删除单条日志
     */
    deleteById: (id: number) =>
        del(`/log/delete/${id}`),

    /**
     * 按用户ID删除所有日志
     */
    deleteByUserId: (userId: number) =>
        del(`/log/delete/user/${userId}`),

    // ================== 查询 ==================

    /**
     * 根据ID查询日志
     */
    getById: (id: number) =>
        get(`/log/get/${id}`),

    /**
     * 查询全部日志
     */
    getAll: () =>
        get('/log/all'),

    /**
     * 根据用户ID查询日志
     */
    getByUserId: (userId: number) =>
        get(`/log/user/${userId}`),

    /**
     * 根据操作类型查询日志
     */
    getByType: (type: string) =>
        get(`/log/type/${type}`),

    /**
     * 分页查询日志
     */
    getPage: (page: number, size: number) =>
        get('/log/page', { page, size }),

    // ================== 统计 ==================

    /**
     * 查询日志总数
     */
    countAll: () =>
        get('/log/count'),
};

export default userActionLogApi;