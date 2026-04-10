import { get, post, put, del } from '../utils/axios'; // 引入自定义的 axios 方法

const gameRecordApi = {
    // 获取所有游戏记录
    getAllGameRecords: () => get('/game-record/all'),

    // 创建游戏记录
    addGameRecord: (data: object) => post('/game-record/add', data),

    // 更新游戏记录
    updateGameRecord: (data: object) => put('/game-record/update', data),

    // 删除游戏记录
    deleteGameRecord: (id: number) => del(`/game-record/delete/${id}`),

    // 根据 recordId 获取记录
    getGameRecordById: (id: number) => get(`/game-record/${id}`),

    // 根据 userId 获取该用户的所有记录
    getGameRecordsByUserId: (userId: number) => get(`/game-record/user/${userId}`)
};

export default gameRecordApi;