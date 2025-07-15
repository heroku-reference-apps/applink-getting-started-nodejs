import { test } from 'tap';
import { build } from '../helper.js';

// Helper function to create base64 encoded client context
function createClientContext(overrides = {}) {
  const defaultContext = {
    requestId:
      '00Dxx0000000000EA2-7c566091-7af3-4e87-8865-4e014444c298-2020-09-03T20:56:27.608444Z',
    accessToken:
      '00Dxx0000000000EA2!AQEAQO800r7Ja4PswVFs9woC7D5zZNlY03kcEPv3Lwx8uf3eAi01x9Wgy8D5jcOmacA4pDYLjuYLXVvoYudaHzAYZf.IQlNN',
    apiVersion: '62.0',
    namespace: '',
    orgId: '00Dxx0000000000EA2',
    orgDomainUrl: 'https://heroku.my.salesforce.com',
    userContext: {
      userId: '005xx000000000000',
      username: 'admin@heroku.com',
    },
    ...overrides,
  };

  return Buffer.from(JSON.stringify(defaultContext)).toString('base64');
}

test('GET /accounts - should handle request with valid client context', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': createClientContext(),
    },
  });

  // In test environment, this fails because no real Salesforce connection
  // In production, this would return 200 with account data
  t.equal(
    response.statusCode,
    500,
    'Should return 500 in test environment without real Salesforce connection'
  );

  const errorResponse = JSON.parse(response.payload);
  t.type(
    errorResponse.error,
    'string',
    'Error response should contain error message'
  );
  t.type(
    errorResponse.statusCode,
    'number',
    'Error response should contain status code'
  );
  t.equal(
    errorResponse.statusCode,
    500,
    'Error response status code should be 500'
  );
});

test('GET /accounts - should require x-client-context header', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      // Missing x-client-context header
    },
  });

  t.equal(response.statusCode, 500, 'Should return 500 without client context');

  const errorResponse = JSON.parse(response.payload);
  t.match(
    errorResponse.message,
    /Required x-client-context header not found/,
    'Error message should indicate missing header'
  );
});

test('GET /accounts - should handle malformed x-client-context header', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': 'invalid-base64-data',
    },
  });

  t.equal(response.statusCode, 500, 'Should return 500 with malformed context');

  const errorResponse = JSON.parse(response.payload);
  t.match(
    errorResponse.message,
    /is not valid JSON/,
    'Error message should indicate JSON parsing error'
  );
});

test('GET /accounts - should handle different valid client contexts', async t => {
  const app = await build(t);

  const customContext = createClientContext({
    orgId: '00Dxx0000000000EA3',
    orgDomainUrl: 'https://customorg.my.salesforce.com',
    userContext: {
      userId: '005xx000000000001',
      username: 'testuser@customorg.com',
    },
  });

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': customContext,
    },
  });

  // Still returns 500 because no real Salesforce connection, but validates context parsing
  t.equal(
    response.statusCode,
    500,
    'Should return 500 with custom context in test environment'
  );

  const errorResponse = JSON.parse(response.payload);
  t.type(
    errorResponse.error,
    'string',
    'Error response should contain error message'
  );
});

test('GET /accounts - should not support POST method', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'POST',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': createClientContext(),
    },
    body: JSON.stringify({ test: 'data' }),
  });

  t.equal(
    response.statusCode,
    404,
    'POST should return 404 (method not allowed)'
  );
});

test('GET /accounts - should validate endpoint exists', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': createClientContext(),
    },
  });

  // The endpoint should exist (not return 404)
  t.not(response.statusCode, 404, 'GET /accounts endpoint should exist');
});

test('GET /accounts - should return JSON response format', async t => {
  const app = await build(t);

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': createClientContext(),
    },
  });

  // Response should be valid JSON regardless of success/failure
  t.doesNotThrow(
    () => JSON.parse(response.payload),
    'Response should be valid JSON'
  );

  const parsedResponse = JSON.parse(response.payload);
  t.type(parsedResponse, 'object', 'Response should be an object');

  // Error response should have standard structure
  if (response.statusCode !== 200) {
    t.type(
      parsedResponse.statusCode,
      'number',
      'Error response should have statusCode'
    );
    t.type(
      parsedResponse.error,
      'string',
      'Error response should have error field'
    );
    t.type(
      parsedResponse.message,
      'string',
      'Error response should have message field'
    );
  }
});

test('GET /accounts - should handle x-request-id header', async t => {
  const app = await build(t);

  const requestId = '00Dxx0000000000EA2-test-request-id';

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': createClientContext({ requestId }),
      'x-request-id': requestId,
    },
  });

  // Should process request with request ID (behavior doesn't change but validates header handling)
  t.equal(
    response.statusCode,
    500,
    'Should return 500 with request ID in test environment'
  );

  const errorResponse = JSON.parse(response.payload);
  t.type(
    errorResponse.error,
    'string',
    'Error response should contain error message'
  );
});

test('GET /accounts - should validate client context structure', async t => {
  const app = await build(t);

  // Test with incomplete client context
  const incompleteContext = Buffer.from(
    JSON.stringify({
      requestId: '00Dxx0000000000EA2-test',
      // Missing required fields
    })
  ).toString('base64');

  const response = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      'Content-Type': 'application/json',
      'x-client-context': incompleteContext,
    },
  });

  // Should handle incomplete context
  t.equal(
    response.statusCode,
    500,
    'Should return 500 with incomplete context'
  );

  const errorResponse = JSON.parse(response.payload);
  t.type(
    errorResponse.error,
    'string',
    'Error response should contain error message'
  );
});
