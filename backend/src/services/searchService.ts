import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';
import type { User, Reference } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchFilters {
  verification_status?: 'verified' | 'unverified';
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  assembly_number?: string;
  polling_station_number?: string;
  city?: string;
  state?: string;
  age_min?: number;
  age_max?: number;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sort_by?:
    | 'created_at'
    | 'updated_at'
    | 'full_name'
    | 'age'
    | 'assembly_number';
  sort_order?: 'asc' | 'desc';
}

export interface ReferenceSearchOptions {
  page?: number;
  limit?: number;
  sort_by?:
    | 'created_at'
    | 'updated_at'
    | 'reference_name'
    | 'user.fullName'
    | 'status'
    | 'whatsappSent'
    | 'statusUpdatedAt';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserSearchResult extends Omit<User, 'password'> {}

export interface ReferenceSearchResult extends Reference {
  user_name?: string;
  user_contact?: string;
  user_aadhar?: string;
}

class SearchService {
  /**
   * Search users with advanced filtering and pagination using database
   */
  async searchUsers(
    query: string = '',
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<UserSearchResult>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'createdAt',
        sort_order = 'desc',
      } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Add text search with relaxed matching
      if (query.trim()) {
        const searchTerm = query.trim();
        const searchWords = searchTerm
          .split(/\s+/)
          .filter(word => word.length > 0);

        // Build OR conditions for each search word (relaxed matching)
        // Note: MySQL doesn't support mode: 'insensitive', so we'll use contains without mode
        const searchConditions = searchWords.flatMap(word => [
          { fullName: { contains: word } },
          { contact: { contains: word } },
          { email: { contains: word } },
          { aadharNumber: { contains: word } },
          { assemblyName: { contains: word } },
          { qualification: { contains: word } },
          { occupation: { contains: word } },
        ]);

        where.OR = searchConditions;
      }

      // Add filters
      if (filters.verification_status) {
        where.isVerified = filters.verification_status === 'verified';
      }

      if (filters.sex) {
        where.sex = filters.sex;
      }

      if (filters.assembly_number) {
        where.assemblyNumber = filters.assembly_number;
      }

      if (filters.polling_station_number) {
        where.pollingStationNumber = filters.polling_station_number;
      }

      if (filters.city) {
        where.city = { contains: filters.city };
      }

      if (filters.state) {
        where.state = { contains: filters.state };
      }

      // Age range filter
      if (filters.age_min || filters.age_max) {
        where.age = {};
        if (filters.age_min) where.age.gte = filters.age_min;
        if (filters.age_max) where.age.lte = filters.age_max;
      }

      // Build orderBy
      const orderBy: any = {};
      if (sort_by === 'full_name') {
        orderBy.fullName = sort_order;
      } else if (sort_by === 'created_at') {
        orderBy.createdAt = sort_order;
      } else if (sort_by === 'updated_at') {
        orderBy.updatedAt = sort_order;
      } else if (sort_by === 'assembly_number') {
        orderBy.assemblyNumber = sort_order;
      } else {
        orderBy[sort_by] = sort_order;
      }

      // Execute search
      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            aadharNumber: true,
            fullName: true,
            contact: true,
            email: true,
            sex: true,
            isVerified: true,
            assemblyNumber: true,
            assemblyName: true,
            pollingStationNumber: true,
            city: true,
            state: true,
            pincode: true,
            age: true,
            qualification: true,
            occupation: true,
            createdAt: true,
            updatedAt: true,
            verifiedAt: true,
            verifiedBy: true,
            dateOfBirth: true,
            epicNumber: true,
            graduationYear: true,
            guardianSpouse: true,
            houseNumber: true,
            street: true,
            area: true,
            graduationDocType: true,

            disabilities: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to search users', {
        query,
        filters,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search references with filtering and pagination using database
   */
  async searchReferences(
    query: string = '',
    filters: { status?: string; user_id?: string } = {},
    options: ReferenceSearchOptions = {}
  ): Promise<SearchResult<ReferenceSearchResult>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'createdAt',
        sort_order = 'desc',
      } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Add text search with relaxed matching
      if (query.trim()) {
        const searchTerm = query.trim();
        const searchWords = searchTerm
          .split(/\s+/)
          .filter(word => word.length > 0);

        // Build OR conditions for each search word (relaxed matching)
        // Note: MySQL doesn't support mode: 'insensitive', so we'll use contains without mode
        const searchConditions = searchWords.flatMap(word => [
          { referenceName: { contains: word } },
          { referenceContact: { contains: word } },
          {
            user: { fullName: { contains: word } },
          },
        ]);

        where.OR = searchConditions;
      }

      // Add filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.user_id) {
        where.userId = filters.user_id;
      }

      // Build orderBy with safe field mapping
      let orderBy: any = {};

      switch (sort_by) {
        case 'reference_name':
          orderBy = { referenceName: sort_order };
          break;
        case 'created_at':
          orderBy = { createdAt: sort_order };
          break;
        case 'updated_at':
          orderBy = { updatedAt: sort_order };
          break;
        case 'statusUpdatedAt':
          orderBy = { statusUpdatedAt: sort_order };
          break;
        case 'whatsappSent':
          orderBy = { whatsappSent: sort_order };
          break;
        case 'status':
          orderBy = { status: sort_order };
          break;
        case 'user.fullName':
          orderBy = { user: { fullName: sort_order } };
          break;
        default:
          // Default to createdAt if invalid sort field
          orderBy = { createdAt: 'desc' };
          break;
      }

      // Execute search
      const [data, total] = await Promise.all([
        prisma.reference.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                fullName: true,
                contact: true,
                aadharNumber: true,
              },
            },
          },
        }),
        prisma.reference.count({ where }),
      ]);

      // Keep the user data nested as expected by frontend
      const transformedData = data.map(reference => ({
        ...reference,
        user: {
          id: reference.userId,
          fullName: reference.user?.fullName || '',
          contact: reference.user?.contact || '',
          aadharNumber: reference.user?.aadharNumber || '',
        },
      }));

      const result = {
        data: transformedData,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      };

      return result;
    } catch (error) {
      logger.error('Failed to search references', {
        query,
        filters,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  // Placeholder methods for compatibility (no-op since we're not using Elasticsearch)
  async indexUser(user: User): Promise<void> {
    // No-op: Database-based search doesn't require indexing
    logger.debug('User indexing skipped (using database search)', {
      userId: user.id,
    });
  }

  async indexReference(
    reference: Reference & {
      user?: Pick<User, 'fullName' | 'contact' | 'aadharNumber'>;
    }
  ): Promise<void> {
    // No-op: Database-based search doesn't require indexing
    logger.debug('Reference indexing skipped (using database search)', {
      referenceId: reference.id,
    });
  }

  async deleteUserIndex(userId: string): Promise<void> {
    // No-op: Database-based search doesn't require index deletion
    logger.debug('User index deletion skipped (using database search)', {
      userId,
    });
  }

  async deleteReferenceIndex(referenceId: string): Promise<void> {
    // No-op: Database-based search doesn't require index deletion
    logger.debug('Reference index deletion skipped (using database search)', {
      referenceId,
    });
  }

  async bulkIndexUsers(users: User[]): Promise<void> {
    // No-op: Database-based search doesn't require bulk indexing
    logger.debug('Bulk user indexing skipped (using database search)', {
      count: users.length,
    });
  }

  async getUserNameSuggestions(
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          fullName: {
            contains: query,
          },
        },
        select: {
          fullName: true,
        },
        take: limit,
        distinct: ['fullName'],
      });

      return users.map(user => user.fullName);
    } catch (error) {
      logger.error('Failed to get user name suggestions', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}

export default new SearchService();
