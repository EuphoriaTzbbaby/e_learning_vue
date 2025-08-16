import axios from 'axios';

// 设置接口基础地址
const baseURL = 'http://192.168.2.2:5000';

// ---------------------- 类型定义 ----------------------

// 获取笔记信息请求体
export interface FetchNoteInfoRequest {
  note_url: string;
}
// 笔记信息结构
export interface NoteInfo {
  noteId: string;
  title: string;
  url: string;
}

// 获取笔记信息响应体
export interface FetchNoteInfoResponse {
  success: boolean;
  message: string;
  note_info: NoteInfo;
}

// 获取评论请求体
export interface FetchCommentsRequest {
  note_url: string;
}

// 子评论结构
export interface SubCommentItem {
  user_id: string;
  nickname: string;
  avatar: string;
  content: string;
  ip_location: string;
  create_time: string;
  likes_count: number;
}

// 评论结构
export interface CommentItem {
  note_id: any;
  noteId: any;
  gender: any;
  level: any;
  comment_id: any;
  user_id: string;
  nickname: string;
  avatar: string;
  content: string;
  ip_location: string;
  create_time: string;
  likes_count: number;
  sub_comments: SubCommentItem[];
  sub_comment_count: number;
}

// 获取评论响应体
export interface FetchCommentsResponse {
  success: boolean;
  message: string;
  comments: CommentItem[];
}

// 情感分类请求体
export interface ClassifyRequest {
  text: string;
}

// 情感分类响应体
export interface ClassifyResponse {
  success: boolean;
  text: string;
  label: string; // "肯定", "否定", "中立"
  confidence: number; // 单个数值，例如 0.9821
  message?: string; // 可选的错误消息
}

// ---------------------- 接口请求函数 ----------------------

/**
 * 获取小红书笔记信息
 * @param data - 请求体参数
 * @returns 笔记信息
 */
export const fetchNoteInfo = async (data: FetchNoteInfoRequest): Promise<FetchNoteInfoResponse> => {
  const res = await axios.post<FetchNoteInfoResponse>(`${baseURL}/api/fetch_note_info`, data);
  return res.data;
};

/**
 * 获取小红书笔记评论
 * @param data - 请求体参数
 * @returns 评论列表
 */
export const fetchComments = async (data: FetchCommentsRequest): Promise<FetchCommentsResponse> => {
  const res = await axios.post<FetchCommentsResponse>(`${baseURL}/api/fetch_comments`, data);
  return res.data;
};

/**
 * 调用文本情感分类接口
 * @param data - 请求体，必须包含 text 字段
 * @returns 分类结果和置信度
 */
export const classifyTextSentiment = async (data: ClassifyRequest): Promise<ClassifyResponse> => {
  const res = await axios.post<ClassifyResponse>(`${baseURL}/api/classify`, data);
  return res.data;
};