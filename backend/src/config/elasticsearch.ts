import { Client } from '@elastic/elasticsearch';
import logger from './logger.js';

let esClient: Client | null = null;

export const initializeElasticsearch = async (): Promise<Client> => {
  if (esClient) {
    return esClient;
  }

  try {
    const config: any = {
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    };

    // Add authentication if credentials are provided
    if (
      process.env.ELASTICSEARCH_USERNAME &&
      process.env.ELASTICSEARCH_PASSWORD
    ) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
    }

    // Add SSL configuration for production
    if (process.env.NODE_ENV === 'production') {
      config.tls = {
        rejectUnauthorized: false, // Set to true in production with proper certificates
      };
    }

    esClient = new Client(config);

    // Test the connection
    await esClient.ping();
    logger.info('Elasticsearch connection established successfully', {
      node: config.node,
    });

    // Initialize indices
    await initializeIndices();

    return esClient;
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch', {
      error: error instanceof Error ? error.message : 'Unknown error',
      node: process.env.ELASTICSEARCH_NODE,
    });
    throw error;
  }
};

export const getElasticsearchClient = (): Client => {
  if (!esClient) {
    throw new Error(
      'Elasticsearch client not initialized. Call initializeElasticsearch() first.'
    );
  }
  return esClient;
};

export const testElasticsearchConnection = async (): Promise<boolean> => {
  try {
    if (!esClient) {
      await initializeElasticsearch();
    }
    await esClient!.ping();
    return true;
  } catch (error) {
    logger.error('Elasticsearch connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

const initializeIndices = async (): Promise<void> => {
  if (!esClient) {
    throw new Error('Elasticsearch client not initialized');
  }

  const indexPrefix =
    process.env.ELASTICSEARCH_INDEX_PREFIX || 'voter_management';
  const usersIndex = `${indexPrefix}_users`;
  const referencesIndex = `${indexPrefix}_references`;

  try {
    // Create users index if it doesn't exist
    const usersIndexExists = await esClient.indices.exists({
      index: usersIndex,
    });
    if (!usersIndexExists) {
      await esClient.indices.create({
        index: usersIndex,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                name_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
                phone_analyzer: {
                  type: 'custom',
                  tokenizer: 'keyword',
                  filter: ['lowercase'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              aadhar_number: {
                type: 'keyword',
                index: true,
              },
              full_name: {
                type: 'text',
                analyzer: 'name_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: {
                    type: 'completion',
                    analyzer: 'name_analyzer',
                  },
                },
              },
              contact: {
                type: 'text',
                analyzer: 'phone_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              email: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              sex: { type: 'keyword' },
              is_verified: { type: 'boolean' },
              assembly_number: { type: 'keyword' },
              assembly_name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              polling_station_number: { type: 'keyword' },
              city: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              state: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              pincode: { type: 'keyword' },
              age: { type: 'integer' },
              qualification: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              occupation: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              verified_at: { type: 'date' },
              verified_by: { type: 'keyword' },
            },
          },
        },
      });
      logger.info('Users index created successfully', { index: usersIndex });
    }

    // Create references index if it doesn't exist
    const referencesIndexExists = await esClient.indices.exists({
      index: referencesIndex,
    });
    if (!referencesIndexExists) {
      await esClient.indices.create({
        index: referencesIndex,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                name_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
                phone_analyzer: {
                  type: 'custom',
                  tokenizer: 'keyword',
                  filter: ['lowercase'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              reference_name: {
                type: 'text',
                analyzer: 'name_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: {
                    type: 'completion',
                    analyzer: 'name_analyzer',
                  },
                },
              },
              reference_contact: {
                type: 'text',
                analyzer: 'phone_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              status: { type: 'keyword' },
              whatsapp_sent: { type: 'boolean' },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              // User information for reference context
              user_name: {
                type: 'text',
                analyzer: 'name_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              user_contact: {
                type: 'text',
                analyzer: 'phone_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              user_aadhar: { type: 'keyword' },
            },
          },
        },
      });
      logger.info('References index created successfully', {
        index: referencesIndex,
      });
    }

    logger.info('Elasticsearch indices initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch indices', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const getIndicesNames = () => {
  const indexPrefix =
    process.env.ELASTICSEARCH_INDEX_PREFIX || 'voter_management';
  return {
    users: `${indexPrefix}_users`,
    references: `${indexPrefix}_references`,
  };
};
