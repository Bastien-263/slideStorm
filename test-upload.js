import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY;
const workspaceId = process.env.WORKSPACE_ID;

async function testUploadFlow() {
  try {
    console.log('=== Testing Dust File Upload Flow ===\n');

    // Step 1: List existing data sources to see if SlideStorm folder exists
    console.log('Step 1: Checking for existing data sources...');
    const dsResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/data_sources`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`
      }
    });

    const dataSources = await dsResponse.json();
    console.log('Data sources:', JSON.stringify(dataSources, null, 2));

    // Step 2: Try to create a folder data source called "SlideStorm"
    console.log('\nStep 2: Creating SlideStorm folder data source...');
    const createDsResponse = await fetch(`https://dust.tt/api/v1/w/${workspaceId}/data_sources`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name: 'SlideStorm',
        description: 'Folder for SlideStorm uploaded images',
        visibility: 'private',
        assistantDefaultSelected: true
      })
    });

    const createDsResult = await createDsResponse.json();
    console.log('Create data source result:', JSON.stringify(createDsResult, null, 2));

    // If we have a data source, try to upload a test image
    if (createDsResult.data_source) {
      const dataSourceName = createDsResult.data_source.name;

      console.log('\nStep 3: Uploading a test document to the folder...');

      // Create a simple test image (1x1 red pixel PNG in base64)
      const testPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const testPngBuffer = Buffer.from(testPngBase64, 'base64');

      const uploadResponse = await fetch(
        `https://dust.tt/api/v1/w/${workspaceId}/data_sources/${dataSourceName}/documents`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            document_id: 'test-image-1',
            timestamp: Date.now(),
            tags: ['test', 'png'],
            source_url: null,
            section: {
              prefix: null,
              content: testPngBase64,
              sections: []
            }
          })
        }
      );

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testUploadFlow();
