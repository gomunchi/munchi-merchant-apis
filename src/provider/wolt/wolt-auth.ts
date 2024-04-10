import { Injectable } from '@nestjs/common';

// TODO: Create an auth service that validate request that come from Wolt by passing a secret from our end (cryptographically random and at least 128 bits in length), using HMAC in the header
@Injectable()
export class WoltAuthService {
  constructor() {}
}
