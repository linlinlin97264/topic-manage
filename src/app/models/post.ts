export interface Post {
  id?: string;
  title: string;
  content: string;
  createdAt?: Date;
}

export type Posts = Post[];
