export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
