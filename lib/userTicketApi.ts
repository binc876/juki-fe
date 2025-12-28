
import { api } from './api';
import { UserTicket } from './types';

export const getUserTicket = async (ticketId: number): Promise<UserTicket> => {
  const response = await api.get(`/user-tickets/${ticketId}`);
  return response.data.data;
};
