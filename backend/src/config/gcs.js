import { Storage } from '@google-cloud/storage';

const storage = new Storage();

const bucketName = 'gsc-2026-uploads';

const bucket = storage.bucket(bucketName);

export { storage, bucket };