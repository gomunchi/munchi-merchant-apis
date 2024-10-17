/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Cryptr from 'cryptr';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(private config: ConfigService) {}

  // TODO: Need to change the name, seem it now only work for ordering co service
  getEnvUrl(path: string, idParam?: string | number, queryParams?: Array<string>): string {
    let envUrl = `${process.env.BASE_URL}/${path}`;
    if (idParam === null || idParam === undefined) return envUrl;
    else envUrl = `${process.env.BASE_URL}/${path}/${idParam}`;
    return envUrl;
  }

  generatePublicId() {
    const publicId = uuidv4();
    return publicId;
  }

  getPassword(password: string, needCrypt: boolean) {
    const cryptr = new Cryptr(this.config.get('HASH_SECRET'));
    let passwordAfter: string;
    if (needCrypt) {
      passwordAfter = cryptr.encrypt(password);
    } else {
      passwordAfter = cryptr.decrypt(password);
    }
    return passwordAfter;
  }

  logError(error: any) {
    this.logger.error(error);
    if (error.response) {
      const errorMsg = error.response.data;
      throw new ForbiddenException(errorMsg);
    } else {
      throw new ForbiddenException(error);
    }
  }

  convertTimeToTimeZone(utcTime: string, targetTimeZone: string): string {
    const allTimeZones = moment.tz.names();

    // Check if the target timezone is valid
    if (allTimeZones.includes(targetTimeZone)) {
      const convertedTime = moment(utcTime).tz(targetTimeZone).toISOString(true);

      return convertedTime;
    }
    return null;
  }
}
