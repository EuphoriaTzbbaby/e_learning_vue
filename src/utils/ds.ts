import deepSeekApi from '../api/deepSeekApi';
// types/deepSeek.ts
export interface ChatRequest {
  message: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface BatchChatRequest {
  requests: ChatRequest[];
}

export interface BatchChatResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// 单个消息聊天
const getDeepSeekResponse = async (message: string, systemPrompt?: string): Promise<string> => {
  try {
    const response = await deepSeekApi.getDeepSeekResponse({ message, systemPrompt });
    
    if (response.data?.success && response.data?.data) {
      return response.data;
    } else {
      throw new Error(response.data?.error || '请求失败');
    }
  } catch (error: any) {
    console.error('调用AI接口失败:', error);
    throw new Error(error.response?.error || '网络请求失败');
  }
};

// 测试连接
const testDeepSeekConnection = async (): Promise<string> => {
  try {
    const response = await deepSeekApi.testDeepSeekConnection();
    
    if (response.data?.success && response.data?.data) {
      return response.data;
    } else {
      throw new Error(response.data?.error || '测试失败');
    }
  } catch (error: any) {
    console.error('测试连接失败:', error);
    throw new Error(error.response?.error || '网络请求失败');
  }
};

// 批量处理
// const batchChat = async (messages: string[], systemPrompt?: string): Promise<string[]> => {
//   try {
//     const requests = messages.map(message => ({ message, systemPrompt }));
//     const response = await deepSeekApi.batchChat(requests);
//     console.log(response.data);
//     if (response.data?.success && response.data?.data) {
//       return response.data.split('\n\n').filter(Boolean);
//     } else {
//       throw new Error(response.data?.error || '批量处理失败');
//     }
//   } catch (error: any) {
//     console.error('批量处理失败:', error);
//     throw new Error(error.response?.error || '网络请求失败');
//   }
// };

export { getDeepSeekResponse, testDeepSeekConnection };
// export {batchChat}
