import { get, post, put, del } from '../utils/axios';

const classTeachersApi = {
  getAlbumsByTeacherId: (id : number) => get(`classTeachers/select/selectByTeacherId/${id}`),
};

export default classTeachersApi;