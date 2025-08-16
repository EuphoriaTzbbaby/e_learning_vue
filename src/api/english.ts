import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const englishApi = {
    // 获取所有记录
    getAllEnglish: () => get('/english/list'),

    // 创建记录
    addEnglish: (data: object) => post('/english/add', data),

    // 更新记录
    updateEnglish: (data: object) => put('/english/update', data),

    // 删除记录
    deleteEnglish: (id: number) => del(`/english/delete/${id}`),

    // 根据 ID 获取记录
    getEnglishById: (id: number) => get(`/english/get/${id}`),
    // 根据 selectVal 获取记录
    getEnglishBySelectVal: (selectVal: string) => get(`/english/get/selectVal/${selectVal}`)
};

export default englishApi;
