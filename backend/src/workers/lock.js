import prisma from '../database/prisma.js';

class WorkerLock {
  static LOCK_TIMEOUT = 60; // seconds
  static EXTEND_INTERVAL = 30; // seconds

  static async acquireLock(lockName, workerId) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_TIMEOUT * 1000);

    try {
      // Try to create a new lock
      await prisma.workerLock.create({
        data: {
          name: lockName,
          workerId,
          acquiredAt: now,
          expiresAt,
        },
      });
      return true;
    } catch (error) {
      // Lock already exists - check if expired
      if (error.code === 'P2002') {
        const existing = await prisma.workerLock.findUnique({
          where: { name: lockName },
        });

        if (existing && new Date(existing.expiresAt) < now) {
          // Lock expired, delete and recreate
          await prisma.workerLock.delete({ where: { name: lockName } });
          return this.acquireLock(lockName, workerId);
        }
        return false;
      }
      throw error;
    }
  }

  static async releaseLock(lockName) {
    try {
      await prisma.workerLock.delete({ where: { name: lockName } });
    } catch {
      // Lock doesn't exist, ignore
    }
  }

  static async extendLock(lockName) {
    const newExpiry = new Date(Date.now() + this.LOCK_TIMEOUT * 1000);
    try {
      await prisma.workerLock.update({
        where: { name: lockName },
        data: { expiresAt: newExpiry },
      });
    } catch {
      // Lock doesn't exist
    }
  }
}

export default WorkerLock;
