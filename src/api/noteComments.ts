import { get, post, put, del } from '../utils/axios';

export interface NoteComment {
  id: number;
  noteId: string;
  commentId: string;
  userId: string;
  nickname: string;
  gender?: string;
  ipLocation?: string;
  content: string;
  likeCount: number;
  level?: string;
  createdAt: string;
}

const noteCommentsApi = {
  getAllComments: async (): Promise<NoteComment[]> => {
    const res = await get('/note-comments/query/all');
    return res.data;
  },

  getCommentsBySelectVal: async (selectVal: string): Promise<NoteComment[]> => {
    const res = await get(`/note-comments/query/selectVal/${selectVal}`);
    return res.data;
  },

  getCommentById: async (id: number): Promise<NoteComment> => {
    const res = await get(`/note-comments/query/${id}`);
    return res.data;
  },

  getCommentByCommentId: async (commentId: string): Promise<NoteComment> => {
    const res = await get(`/note-comments/query/commentId/${commentId}`);
    return res.data;
  },

  getCommentsByNoteId: async (noteId: string): Promise<NoteComment[]> => {
    const res = await get(`/note-comments/query/noteId/${noteId}`);
    return res.data;
  },

  getCommentsByUserId: async (userId: string): Promise<NoteComment[]> => {
    const res = await get(`/note-comments/query/userId/${userId}`);
    return res.data;
  },

  createComment: async (data: {
    noteId: string;
    userId: string;
    nickname: string;
    content: string;
    gender?: string;
    ipLocation?: string;
    level?: string;
    commentId?: string;
    likeCount?: number;
    createdAt?: string;
  }): Promise<NoteComment> => {
    const res = await post('/note-comments/create', data);
    return res.data;
  },

  updateComment: async (
    id: number,
    data: {
      content?: string;
      likeCount?: number;
      level?: string;
    }
  ): Promise<void> => {
    await put(`/note-comments/update/${id}`, data);
  },

  deleteCommentById: async (id: number): Promise<void> => {
    await del(`/note-comments/delete/${id}`);
  },

  deleteCommentByCommentId: async (commentId: string): Promise<void> => {
    await del(`/note-comments/delete/commentId/${commentId}`);
  },

  deleteCommentsByNoteId: async (noteId: string): Promise<void> => {
    await del(`/note-comments/delete/noteId/${noteId}`);
  },
  // 批量插入接口
  batchCreateComments: async (data: {
    noteId: string;
    userId: string;
    nickname: string;
    content: string;
    gender?: string;
    ipLocation?: string;
    level?: string;
    commentId?: string;
    likeCount?: number;
    createdAt?: string;
  }[]): Promise<string> => {
    const res = await post('/note-comments/batch-create', data);
    return res.data;
  },
};

export default noteCommentsApi;
