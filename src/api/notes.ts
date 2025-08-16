import { get, post, put, del } from '../utils/axios';

export interface NoteItem {
  id: number;
  noteId: string;
  title: string;
  url: string;
  createdAt: string;
}

const notesApi = {
  getAllNotes: async (): Promise<NoteItem[]> => {
    const res = await get('/notes/query/all');
    return res.data; // 取data
  },
  
  getNotesBySelectVal: async (selectVal: string): Promise<NoteItem[]> => {
    console.log(selectVal, 999999)
    const res = await get(`/notes/query/selectVal/${selectVal}`);
    return res.data;
  },

  getNoteById: async (id: number): Promise<NoteItem> => {
    const res = await get(`/notes/query/${id}`);
    return res.data;
  },

  getNoteByNoteId: async (noteId: string): Promise<NoteItem> => {
    const res = await get(`/notes/query/noteId/${noteId}`);
    return res.data;
  },

  createNote: async (data: { title: string; url: string; noteId?: string; createdAt?: string }): Promise<NoteItem> => {
    const res = await post('/notes/create', data);
    return res.data;
  },

  updateNote: async (id: number, data: { title: string; url: string }): Promise<void> => {
    await put(`/notes/update/${id}`, data);
  },

  deleteNoteById: async (id: number): Promise<void> => {
    await del(`/notes/delete/${id}`);
  },

  deleteNoteByNoteId: async (noteId: string): Promise<void> => {
    await del(`/notes/delete/noteId/${noteId}`);
  }
};

export default notesApi;
