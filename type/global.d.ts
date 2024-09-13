/**
 * @author: leroy
 * @date: 2024-07-03 16:11
 * @description：tying.d.ts
 */

import type { RedisClientType } from 'redis';
declare global {
  var redisClient: RedisClientType | null;
  var cacheApis: string[] | undefined;
}
