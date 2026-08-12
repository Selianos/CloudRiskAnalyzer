import { prisma } from '../prisma.js';
import { createClient } from 'redis';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Initialize a shared Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379/0'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis queue:', err.message);
});
export const getScans = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user identifier' });
    }

    const scans = await prisma.scan_jobs.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        connections: {
          select: { id: true, name: true, provider: true }
        }
      }
    });

    res.json(scans);
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Internal server error while retrieving scans' });
  }
};

export const createScan = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user identifier' });
    }

    const { connection_id } = req.body;
    if (!connection_id) {
      return res.status(400).json({ error: 'Missing required field: connection_id' });
    }

    if (!UUID_REGEX.test(connection_id)) {
      return res.status(400).json({ error: 'Invalid connection_id format' });
    }

    // Verify connection exists and belongs to user
    const connection = await prisma.connections.findFirst({
      where: {
        id: connection_id,
        user_id: userId
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or access denied' });
    }

    // Create a new scan job with PENDING status
    const newScanJob = await prisma.scan_jobs.create({
      data: {
        connection_id: connection_id,
        user_id: userId,
        status: 'PENDING'
      }
    });

    // Publish job trigger event to Redis queue for instant worker execution
    try {
      await redisClient.rPush('scan_queue', newScanJob.id);
    } catch (redisError) {
      console.error('Failed to push job ID to Redis queue:', redisError.message);
      // Proceed gracefully as database fallback will still pick it up
    }
    res.status(201).json(newScanJob);
  } catch (error) {
    console.error('Error creating scan job:', error);
    res.status(500).json({ error: 'Internal server error while triggering scan' });
  }
};

export const getScanById = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user identifier' });
    }

    const { scan_id } = req.params;
    if (!scan_id || !UUID_REGEX.test(scan_id)) {
      return res.status(400).json({ error: 'Invalid scan_id format' });
    }

    const scanJob = await prisma.scan_jobs.findFirst({
      where: {
        id: scan_id,
        user_id: userId
      }
    });

    if (!scanJob) {
      return res.status(404).json({ error: 'Scan job not found or access denied' });
    }

    res.json(scanJob);
  } catch (error) {
    console.error('Error fetching scan job:', error);
    res.status(500).json({ error: 'Internal server error while retrieving scan status' });
  }
};

export const getScanResults = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user identifier' });
    }

    const { scan_id } = req.params;
    if (!scan_id || !UUID_REGEX.test(scan_id)) {
      return res.status(400).json({ error: 'Invalid scan_id format' });
    }

    // Verify scan job exists and belongs to user
    const scanJob = await prisma.scan_jobs.findFirst({
      where: {
        id: scan_id,
        user_id: userId
      }
    });

    if (!scanJob) {
      return res.status(404).json({ error: 'Scan job not found or access denied' });
    }

    // Retrieve findings with associated resource and rule details
    const results = await prisma.findings.findMany({
      where: {
        scan_job_id: scan_id
      },
      include: {
        resources: true,
        rules: true
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching scan results:', error);
    res.status(500).json({ error: 'Internal server error while retrieving scan results' });
  }
};
