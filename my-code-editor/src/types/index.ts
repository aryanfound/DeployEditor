export interface Project {
  id: string;
  name: string;
  lastModified: string;
  collaborators: User[];
  files: ProjectFile[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  activeUsers?: User[];
  children?: ProjectFile[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

export interface PullRequest {
  id: string;
  title: string;
  author: User;
  status: 'open' | 'closed' | 'merged';
  createdAt: string;
}