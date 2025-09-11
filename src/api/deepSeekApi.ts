import { post, get } from '../utils/axios'; // 引入自定义的 axios 方法

const deepSeekApi = {
  // 单个消息聊天
  getDeepSeekResponse: (data: { message: string; systemPrompt?: string }) => 
    post('/deepseek/chat', data),

  // 测试连接
  testDeepSeekConnection: () => get('/deepseek/test'),

  // 批量处理
  batchChat: (data: Array<{ message: string; systemPrompt?: string }>) => 
    post('/deepseek/batch', data),
};

export default deepSeekApi;
