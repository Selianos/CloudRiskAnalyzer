import { apiClient } from './apiClient';

export const getScans = async () => {
  return apiClient('/scans');
};

export const createScan = async (scanData) => {
  return apiClient('/scans', {
    method: 'POST',
    body: JSON.stringify(scanData),
  });
};

export const getScanById = async (scanId) => {
  return apiClient(`/scans/${scanId}`);
};

export const getScanResults = async (scanId) => {
  return apiClient(`/scans/${scanId}/results`);
};
