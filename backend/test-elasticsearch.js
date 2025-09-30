// Simple test script to verify Elasticsearch integration
import dotenv from 'dotenv';
import {
  initializeElasticsearch,
  testElasticsearchConnection,
} from './dist/config/elasticsearch.js';

// Load environment variables
dotenv.config();

async function testElasticsearch() {
  try {
    console.log('🔍 Testing Elasticsearch connection...');

    // Test connection
    const isConnected = await testElasticsearchConnection();
    if (isConnected) {
      console.log('✅ Elasticsearch connection successful');
    } else {
      console.log('❌ Elasticsearch connection failed');
      return;
    }

    // Initialize Elasticsearch (creates indices)
    console.log('🔧 Initializing Elasticsearch indices...');
    await initializeElasticsearch();
    console.log('✅ Elasticsearch indices initialized successfully');

    console.log('🎉 Elasticsearch integration test completed successfully!');
  } catch (error) {
    console.error('❌ Elasticsearch test failed:', error.message);
    process.exit(1);
  }
}

testElasticsearch();
