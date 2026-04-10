export interface Users {
  id: number;
  username: string;
  password: string;
  role: string;
  name: string;
  email: string;
  createdAt: string;  // Timestamp -> string
  updatedAt: string;  // Timestamp -> string
  state: number;
  avatar: string;
}