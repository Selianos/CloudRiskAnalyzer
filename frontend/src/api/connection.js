import { apiClient } from './apiClient';

export const getPublicConnectionInfo = async () => {
  return apiClient('/connections/public-info');
};

export const getConnections = async () => {
  return apiClient('/connections');
};

export const getConnectionById = async (connectionId) => {
  return apiClient(`/connections/${connectionId}`);
};

export const createConnection = async (connectionData) => {
  return apiClient('/connections', {
    method: 'POST',
    body: JSON.stringify(connectionData),
  });
};

export const updateConnection = async (connectionId, connectionData) => {
  return apiClient(`/connections/${connectionId}`, {
    method: 'PUT',
    body: JSON.stringify(connectionData),
  });
};

export const deleteConnection = async (connectionId) => {
  return apiClient(`/connections/${connectionId}`, {
    method: 'DELETE',
  });
};
