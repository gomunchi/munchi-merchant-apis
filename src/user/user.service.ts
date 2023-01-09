import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { OrderId } from 'src/ts';

import { GetEnvUrl } from '../utils/getEnvUrl';
const axios = require('axios');
@Injectable()
export class UserService {
  async getUser(userId: OrderId) {
    // console.log(userId);
    // const options = {
    //   method: 'GET',
    //   url: GetEnvUrl('user', userId),
    //   headers: { accept: 'application/json' },
    // };

    // const userResponse = axios
    //   .request(options)
    //   .then(function (response) {
    //     console.log(response.data);
    //   })
    //   .catch(function (error) {
    //     console.error(error);
    //   });
    // return userResponse;
    return 'This is get User routes';
  }
  getBusiness(token: string) {
    const options = {
      method: 'GET',
      url: GetEnvUrl('business'),
      headers: {
        accept: 'application/json',
        Authorization: `${token}`,
      },
    };

    const businessResponse = axios
      .request(options)
      .then(function (response: any) {
        console.log(response.data);
        const data =
          response.data.result;
        return data;
      })
      .catch(function (error: any) {
        const errorMsg =
          error.response.data.result;
        throw new ForbiddenException(errorMsg);
      });
    return businessResponse;
  }
  getAllBusiness(token: string) {
    const options = {
      method: 'GET',
      url: ` ${GetEnvUrl(
        'business',
      )}?type=1&mode=dashboard`,
      headers: {
        accept: 'application/json',
        Authorization: `${token}`,
      },
    };

    const allBusinessResponse = axios
      .request(options)
      .then(function (response: any) {
        console.log(response.data);
        const data = response.data.result;
        return data;
      })
      .catch(function (error: any) {
        const errorMsg =
          error.response.data.result;
        throw new ForbiddenException(errorMsg);
      });
    return allBusinessResponse;
  }
}
