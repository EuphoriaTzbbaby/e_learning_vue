export interface Comment {
  id: number;
  videoId: number;
  userId: number;
  content: string;
  createTime: string; // 后端返回时间一般是字符串
}