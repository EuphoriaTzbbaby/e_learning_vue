import { get } from '../utils/axios';

const classTeachersApi = {
  getAlbumsByTeacherId: (id : number) => get(`classTeachers/select/selectByTeacherId/${id}`),
};

export default classTeachersApi;