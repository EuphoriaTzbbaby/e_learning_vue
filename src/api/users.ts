import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const usersApi = {
    // 登录校验
    checkLogin: (data: object) => post('/users/check', data),

    // 获取所有用户
    getAllUsers: () => get('/users/selectAll'),

    // 根据 ID 获取用户
    getUserById: (id: number) => get(`/users/${id}`),

    // 获取某班级的所有学生和教师
    getStudentsAndTeachers: (classId: number) => get(`/users/selectStudentsAndTeachers/${classId}`),

    // 根据关键字和班级 ID 查询学生和教师
    searchInClass: (selectVal: string, classId: number) => get(`/users/select/${selectVal}/${classId}`),

    // 根据关键字搜索所有用户
    searchUsers: (selectVal: string) => get(`/users/select/${selectVal}`),

    // 新增用户
    addUser: (data: object) => post('/users/insert', data),

    // 更新用户信息
    updateUser: (data: object) => put('/users/updateById', data),

    // 删除用户
    deleteUser: (id: number) => del(`/users/delete/${id}`)
};

export default usersApi;
