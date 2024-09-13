/**
 * @author: leroy
 * @date: 2024-07-04 17:22
 * @description：util
 */
import * as jwt from 'jsonwebtoken';

export const verifyToken = async (token: string, jwtSecret: string) => {
  if (!token) return undefined;
  try {
    return jwt.verify(token, jwtSecret) as unknown as jwt.JwtPayload;
  } catch (e: any) {
    console.log('jwt', e.message);
    return undefined;
  }
};
