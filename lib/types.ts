export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  userId: string;
  url: string;
  title: string;
  favicon: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  orderIndex: number;
};
