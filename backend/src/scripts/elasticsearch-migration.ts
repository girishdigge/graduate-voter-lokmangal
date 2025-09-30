import { PrismaClient } from '@prisma/client';
import { initializeElasticsearch } from '../config/elasticsearch.js';
import searchService from '../services/searchService.js';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

/**
 * Migrate existing users to Elasticsearch
 */
async function migrateUsers() {
  try {
    logger.info('Starting user migration to Elasticsearch...');

    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        aadhar_number: true,
        full_name: true,
        contact: true,
        email: true,
        sex: true,
        is_verified: true,
        assembly_number: true,
        assembly_name: true,
        polling_station_number: true,
        city: true,
        state: true,
        pincode: true,
        age: true,
        qualification: true,
        occupation: true,
        created_at: true,
        updated_at: true,
        verified_at: true,
        verified_by: true,
      },
    });

    if (users.length === 0) {
      logger.info('No users found to migrate');
      return;
    }

    logger.info(`Found ${users.length} users to migrate`);

    // Bulk index users in batches of 100
    const batchSize = 100;
    let migratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      try {
        await searchService.bulkIndexUsers(batch);
        migratedCount += batch.length;
        logger.info(
          `Migrated batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users`
        );
      } catch (error) {
        errorCount += batch.length;
        logger.error(
          `Failed to migrate batch ${Math.floor(i / batchSize) + 1}`,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            batchSize: batch.length,
          }
        );
      }
    }

    logger.info('User migration completed', {
      totalUsers: users.length,
      migratedCount,
      errorCount,
    });
  } catch (error) {
    logger.error('User migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Migrate existing references to Elasticsearch
 */
async function migrateReferences() {
  try {
    logger.info('Starting reference migration to Elasticsearch...');

    // Get all references with user information
    const references = await prisma.reference.findMany({
      include: {
        user: {
          select: {
            full_name: true,
            contact: true,
            aadhar_number: true,
          },
        },
      },
    });

    if (references.length === 0) {
      logger.info('No references found to migrate');
      return;
    }

    logger.info(`Found ${references.length} references to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    // Index references one by one (they're typically fewer than users)
    for (const reference of references) {
      try {
        await searchService.indexReference({
          ...reference,
          user: {
            full_name: reference.user.full_name,
            contact: reference.user.contact,
            aadhar_number: reference.user.aadhar_number,
          },
        });
        migratedCount++;

        if (migratedCount % 50 === 0) {
          logger.info(`Migrated ${migratedCount} references so far...`);
        }
      } catch (error) {
        errorCount++;
        logger.error(`Failed to migrate reference ${reference.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          referenceId: reference.id,
        });
      }
    }

    logger.info('Reference migration completed', {
      totalReferences: references.length,
      migratedCount,
      errorCount,
    });
  } catch (error) {
    logger.error('Reference migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    logger.info('Starting Elasticsearch migration...');

    // Initialize Elasticsearch
    await initializeElasticsearch();
    logger.info('Elasticsearch initialized successfully');

    // Migrate users
    await migrateUsers();

    // Migrate references
    await migrateReferences();

    logger.info('Elasticsearch migration completed successfully');
  } catch (error) {
    logger.error('Elasticsearch migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration, migrateUsers, migrateReferences };
