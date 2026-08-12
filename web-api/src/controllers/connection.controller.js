import { prisma } from '../prisma.js';
import { encryptFernet } from '../crypto.js';
import { config } from '../config.js';

// Helper UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getConnections = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier' });
  }

  try {
    const userConnections = await prisma.connections.findMany({
      where: { user_id: userId },
      include: {
        scan_jobs: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            findings: {
              include: {
                rules: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Sanitize connections: omit the sensitive credentials field in GET responses
    const sanitized = userConnections.map(({ credentials, ...rest }) => rest);
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Internal server error while fetching connections' });
  }
};

export const getConnectionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier' });
  }

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid connection ID format' });
  }

  try {
    const connection = await prisma.connections.findFirst({
      where: { id, user_id: userId }
    });
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or access denied' });
    }

    // Sanitize connection: omit the sensitive credentials field in GET responses
    const { credentials, ...sanitized } = connection;
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching connection details:', error);
    res.status(500).json({ error: 'Internal server error while fetching connection details' });
  }
};

export const createConnection = async (req, res) => {
  const { name, provider, credentials } = req.body;
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier' });
  }

  if (!name || !provider || !credentials) {
    return res.status(400).json({ error: 'Missing required fields: name, provider, credentials' });
  }

  const supportedProviders = ['aws', 'gcp', 'oci'];
  if (!supportedProviders.includes(provider.toLowerCase())) {
    return res.status(400).json({ error: `Unsupported provider. Must be one of: ${supportedProviders.join(', ')}` });
  }

  try {
    // Encrypt raw credentials using the shared Fernet encryption key
    const credentialsString = JSON.stringify(credentials);
    const encryptedToken = encryptFernet(credentialsString, config.encryptionKey);
    const credentialsPayload = { encrypted: encryptedToken };

    const newConnection = await prisma.connections.create({
      data: {
        user_id: userId,
        name,
        provider: provider.toLowerCase(),
        credentials: credentialsPayload
      }
    });

    // Return the response without the encrypted credentials
    const { credentials: _, ...sanitized } = newConnection;
    res.status(201).json(sanitized);
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Internal server error while creating connection' });
  }
};

export const updateConnection = async (req, res) => {
  const { id } = req.params;
  const { name, provider, credentials } = req.body;
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier' });
  }

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid connection ID format' });
  }

  try {
    const connection = await prisma.connections.findFirst({
      where: { id, user_id: userId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or access denied' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) {
      const supportedProviders = ['aws', 'gcp', 'oci'];
      if (!supportedProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({ error: `Unsupported provider. Must be one of: ${supportedProviders.join(', ')}` });
      }
      updateData.provider = provider.toLowerCase();
    }
    if (credentials !== undefined) {
      const credentialsString = JSON.stringify(credentials);
      const encryptedToken = encryptFernet(credentialsString, config.encryptionKey);
      updateData.credentials = { encrypted: encryptedToken };
    }

    const updated = await prisma.connections.update({
      where: { id },
      data: updateData
    });

    // Return sanitized update response
    const { credentials: _, ...sanitized } = updated;
    res.json(sanitized);
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ error: 'Internal server error while updating connection' });
  }
};

export const deleteConnection = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier' });
  }

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid connection ID format' });
  }

  try {
    const connection = await prisma.connections.findFirst({
      where: { id, user_id: userId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or access denied' });
    }

    await prisma.connections.delete({
      where: { id }
    });

    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Internal server error while deleting connection' });
  }
};

export const getPublicInfo = (req, res) => {
  res.json({
    message: 'This is a public, unauthenticated endpoint listing supported cloud providers.',
    supported_providers: ['aws', 'gcp', 'oci'],
    version: '1.0.0'
  });
};
