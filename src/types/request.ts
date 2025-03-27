import { TokenPayload } from './user.types';

declare module 'express' {
  export interface Request {
    user?: TokenPayload;
  }
}
