// config/s3.js (AWS SDK v3)
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

module.exports = s3Client;

//udelectronics.com.s3.us-east-1.amazonaws.com  cloudFront