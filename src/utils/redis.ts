/**
 * @author: leroy
 * @date: 2024-07-03 16:04
 * @description：redis
 */

import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

export const initClient = async (): Promise<RedisClientType | null> => {
  if (global.redisClient) return global.redisClient;
  // 创建的redis实例挂载在global上，避免重复创建
  global.redisClient = createClient({
    url: `redis://${process.env.REDIS_URL}`,
    password: process.env.REDIS_PASSWORD,
  });
  global.redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
    global.redisClient = null;
  });
  global.redisClient.on('connect', () => {
    console.info('Redis Client Connecting');
  });
  await global.redisClient.connect();
  return global.redisClient;
};
