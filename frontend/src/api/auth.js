import { apiClient } from './apiClient';

export const signupUser = async (userData) => {
  return apiClient('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (credentials) => {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const logoutUser = async () => {
  return apiClient('/auth/logout', {
    method: 'POST',
  });
};
