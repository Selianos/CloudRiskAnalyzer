// Shared Test Helpers and Fixtures for Vitest Suite

// 1. Reusable UUID Fixtures
export const MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';
export const MOCK_CONNECTION_ID = '22222222-2222-2222-2222-222222222222';
export const MOCK_SCAN_ID = '33333333-3333-3333-3333-333333333333';
export const MOCK_FINDING_ID = '44444444-4444-4444-4444-444444444444';

// 2. Reusable Database Fixtures
export const MOCK_USER = {
  id: MOCK_USER_ID,
  email: 'testuser@example.com',
  fullname: 'Test User'
};

export const MOCK_CONNECTION = {
  id: MOCK_CONNECTION_ID,
  user_id: MOCK_USER_ID,
  name: 'Production AWS Account',
  provider: 'aws',
  credentials: {
    aws_access_key_id: 'AKIA1234567890',
    aws_secret_access_key: 'secret-key-xyz'
  }
};

export const MOCK_SCAN_JOB = {
  id: MOCK_SCAN_ID,
  connection_id: MOCK_CONNECTION_ID,
  user_id: MOCK_USER_ID,
  status: 'COMPLETED',
  started_at: new Date('2026-08-04T00:00:00.000Z'),
  completed_at: new Date('2026-08-04T01:00:00.000Z'),
  error_message: null,
  created_at: new Date('2026-08-04T00:00:00.000Z')
};

export const MOCK_RULE = {
  id: 'AWS-S3-001',
  provider: 'aws',
  name: 'S3 Buckets should not be publicly readable',
  severity: 'HIGH',
  description: 'Checks if S3 buckets are configured with public read access.',
  recommendation: 'Modify the S3 bucket access control list (ACL).'
};

export const MOCK_RESOURCE = {
  id: '55555555-5555-5555-5555-555555555555',
  scan_job_id: MOCK_SCAN_ID,
  resource_type: 's3_bucket',
  provider_resource_id: 'arn:aws:s3:::my-public-reports',
  name: 'my-public-reports',
  region: 'us-east-1',
  configuration: { is_public: true }
};

export const MOCK_FINDING = {
  id: MOCK_FINDING_ID,
  scan_job_id: MOCK_SCAN_ID,
  resource_id: MOCK_RESOURCE.id,
  rule_id: MOCK_RULE.id,
  status: 'FAIL',
  details: { reason: 'Bucket permissions set to public read.' },
  created_at: new Date('2026-08-04T00:30:00.000Z'),
  resources: MOCK_RESOURCE,
  rules: MOCK_RULE
};

// 3. Express Request Mock Builder
export const mockRequest = ({ headers = {}, body = {}, params = {}, user = null } = {}) => ({
  headers,
  body,
  params,
  user
});

// 4. Express Response Mock Builder
export const mockResponse = () => {
  const res = {};
  res.statusCode = 200; // Default Express success status code
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  res.send = () => {
    return res;
  };
  return res;
};
