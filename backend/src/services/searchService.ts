import {
  getElasticsearchClient,
  getIndicesNames,
} from '../config/elasticsearch.js';
import logger from '../config/logger.js';
import type { User, Reference } from '@prisma/client';

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
  sort_by?: 'created_at' | 'updated_at' | 'reference_name';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserSearchResult extends Omit<User, 'password'> {
  _score?: number;
}

export interface ReferenceSearchResult extends Reference {
  _score?: number;
  user_name?: string;
  user_contact?: string;
  user_aadhar?: string;
}

class SearchService {
  private esClient = getElasticsearchClient;
  private indices = getIndicesNames();

  /**
   * Index a user document in Elasticsearch
   */
  async indexUser(user: User): Promise<void> {
    try {
      const client = this.esClient();

      // Prepare user document for indexing
      const userDoc = {
        id: user.id,
        aadhar_number: user.aadharNumber,
        full_name: user.fullName,
        contact: user.contact,
        email: user.email,
        sex: user.sex,
        is_verified: user.isVerified,
        assembly_number: user.assemblyNumber,
        assembly_name: user.assemblyName,
        polling_station_number: user.pollingStationNumber,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        age: user.age,
        qualification: user.qualification,
        occupation: user.occupation,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        verified_at: user.verifiedAt,
        verified_by: user.verifiedBy,
      };

      await client.index({
        index: this.indices.users,
        id: user.id,
        body: userDoc,
        refresh: 'wait_for', // Ensure document is immediately searchable
      });

      logger.debug('User indexed successfully', { userId: user.id });
    } catch (error) {
      logger.error('Failed to index user', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Index a reference document in Elasticsearch
   */
  async indexReference(
    reference: Reference & {
      user?: Pick<User, 'fullName' | 'contact' | 'aadharNumber'>;
    }
  ): Promise<void> {
    try {
      const client = this.esClient();

      // Prepare reference document for indexing
      const referenceDoc = {
        id: reference.id,
        user_id: reference.userId,
        reference_name: reference.referenceName,
        reference_contact: reference.referenceContact,
        status: reference.status,
        whatsapp_sent: reference.whatsappSent,
        created_at: reference.createdAt,
        updated_at: reference.updatedAt,
        // Include user information for context
        user_name: reference.user?.fullName,
        user_contact: reference.user?.contact,
        user_aadhar: reference.user?.aadharNumber,
      };

      await client.index({
        index: this.indices.references,
        id: reference.id,
        body: referenceDoc,
        refresh: 'wait_for',
      });

      logger.debug('Reference indexed successfully', {
        referenceId: reference.id,
      });
    } catch (error) {
      logger.error('Failed to index reference', {
        referenceId: reference.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search users with advanced filtering and pagination
   */
  async searchUsers(
    query: string = '',
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<UserSearchResult>> {
    try {
      const client = this.esClient();
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = options;
      const from = (page - 1) * limit;

      // Build the search query
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Add text search if query is provided
      if (query.trim()) {
        searchQuery.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: [
              'full_name^3',
              'full_name.keyword^2',
              'aadhar_number^2',
              'contact^2',
              'contact.keyword^2',
              'email',
              'assembly_name',
              'qualification',
              'occupation',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'and',
          },
        });
      } else {
        // If no query, match all documents
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters.verification_status) {
        searchQuery.bool.filter.push({
          term: { is_verified: filters.verification_status === 'verified' },
        });
      }

      if (filters.sex) {
        searchQuery.bool.filter.push({
          term: { sex: filters.sex },
        });
      }

      if (filters.assembly_number) {
        searchQuery.bool.filter.push({
          term: { assembly_number: filters.assembly_number },
        });
      }

      if (filters.polling_station_number) {
        searchQuery.bool.filter.push({
          term: { polling_station_number: filters.polling_station_number },
        });
      }

      if (filters.city) {
        searchQuery.bool.filter.push({
          term: { 'city.keyword': filters.city },
        });
      }

      if (filters.state) {
        searchQuery.bool.filter.push({
          term: { 'state.keyword': filters.state },
        });
      }

      // Age range filter
      if (filters.age_min || filters.age_max) {
        const ageRange: any = {};
        if (filters.age_min) ageRange.gte = filters.age_min;
        if (filters.age_max) ageRange.lte = filters.age_max;

        searchQuery.bool.filter.push({
          range: { age: ageRange },
        });
      }

      // Build sort configuration
      const sort: any = {};
      if (sort_by === 'full_name') {
        sort['full_name.keyword'] = { order: sort_order };
      } else {
        sort[sort_by] = { order: sort_order };
      }

      // Execute search
      const response = await client.search({
        index: this.indices.users,
        body: {
          query: searchQuery,
          sort: [sort],
          from,
          size: limit,
          _source: {
            excludes: ['password'], // Exclude sensitive fields
          },
        },
      });

      // Process results
      const hits = response.hits.hits;
      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value || 0;
      const data = hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

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
   * Search references with filtering and pagination
   */
  async searchReferences(
    query: string = '',
    filters: { status?: string; user_id?: string } = {},
    options: ReferenceSearchOptions = {}
  ): Promise<SearchResult<ReferenceSearchResult>> {
    try {
      const client = this.esClient();
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = options;
      const from = (page - 1) * limit;

      // Build the search query
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Add text search if query is provided
      if (query.trim()) {
        searchQuery.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: [
              'reference_name^3',
              'reference_name.keyword^2',
              'reference_contact^2',
              'reference_contact.keyword^2',
              'user_name^2',
              'user_contact',
              'user_aadhar',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'and',
          },
        });
      } else {
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters.status) {
        searchQuery.bool.filter.push({
          term: { status: filters.status },
        });
      }

      if (filters.user_id) {
        searchQuery.bool.filter.push({
          term: { user_id: filters.user_id },
        });
      }

      // Build sort configuration
      const sort: any = {};
      sort[sort_by] = { order: sort_order };

      // Execute search
      const response = await client.search({
        index: this.indices.references,
        body: {
          query: searchQuery,
          sort: [sort],
          from,
          size: limit,
        },
      });

      // Process results
      const hits = response.hits.hits;
      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value || 0;
      const data = hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

      return {
        data,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to search references', {
        query,
        filters,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete user from search index
   */
  async deleteUserIndex(userId: string): Promise<void> {
    try {
      const client = this.esClient();

      await client.delete({
        index: this.indices.users,
        id: userId,
        refresh: 'wait_for',
      });

      logger.debug('User removed from search index', { userId });
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        logger.debug('User not found in search index', { userId });
        return;
      }

      logger.error('Failed to delete user from search index', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete reference from search index
   */
  async deleteReferenceIndex(referenceId: string): Promise<void> {
    try {
      const client = this.esClient();

      await client.delete({
        index: this.indices.references,
        id: referenceId,
        refresh: 'wait_for',
      });

      logger.debug('Reference removed from search index', { referenceId });
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        logger.debug('Reference not found in search index', { referenceId });
        return;
      }

      logger.error('Failed to delete reference from search index', {
        referenceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk index users (useful for initial data migration)
   */
  async bulkIndexUsers(users: User[]): Promise<void> {
    try {
      const client = this.esClient();

      if (users.length === 0) {
        return;
      }

      const body = users.flatMap(user => [
        { index: { _index: this.indices.users, _id: user.id } },
        {
          id: user.id,
          aadhar_number: user.aadharNumber,
          full_name: user.fullName,
          contact: user.contact,
          email: user.email,
          sex: user.sex,
          is_verified: user.isVerified,
          assembly_number: user.assemblyNumber,
          assembly_name: user.assemblyName,
          polling_station_number: user.pollingStationNumber,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          age: user.age,
          qualification: user.qualification,
          occupation: user.occupation,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          verified_at: user.verifiedAt,
          verified_by: user.verifiedBy,
        },
      ]);

      const response = await client.bulk({
        body,
        refresh: 'wait_for',
      });

      if (response.errors) {
        const erroredDocuments = response.items.filter(
          (item: any) => item.index?.error
        );
        logger.error('Some users failed to index', {
          errorCount: erroredDocuments.length,
          totalCount: users.length,
          errors: erroredDocuments.map((item: any) => item.index.error),
        });
      } else {
        logger.info('Users bulk indexed successfully', { count: users.length });
      }
    } catch (error) {
      logger.error('Failed to bulk index users', {
        userCount: users.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get search suggestions for user names
   */
  async getUserNameSuggestions(
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const client = this.esClient();

      const response = await client.search({
        index: this.indices.users,
        body: {
          suggest: {
            name_suggest: {
              prefix: query,
              completion: {
                field: 'full_name.suggest',
                size: limit,
              },
            },
          },
          _source: false,
        },
      });

      if (!response.suggest?.name_suggest?.[0]?.options) {
        return [];
      }

      const options = response.suggest.name_suggest[0].options;
      const suggestions = Array.isArray(options)
        ? options.map((option: any) => option.text)
        : [];

      return suggestions;
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
