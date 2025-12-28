export interface Notification {
  id: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
