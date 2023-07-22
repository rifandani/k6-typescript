import { check } from 'k6';
import execution from 'k6/execution';
import http, { RefinedParams, RefinedResponse, ResponseType } from 'k6/http';

export type CustomClientParams = {
  baseUrl?: string;
};
export type CheckFailedTestParams = {
  status: boolean;
  response: RefinedResponse<ResponseType>;
};
export type AdminLoginCreds = {
  username: string;
  password: string;
};
export type AdminLoginSuccessResponse = {
  success: boolean;
  message: string;
  data: { uid: string; name: string; token: string };
};

/**
 * @example
 *
 * ```
 * const client = new CustomClient({})
 * const loginResponseJson = client.adminLogin(creds)
 * ```
 */
export default class CustomClient {
  private baseUrl: string;
  private uniqueId: string;
  private params: RefinedParams<ResponseType> = {
    headers: { 'Content-Type': 'application/json' },
  };

  constructor({
    baseUrl = `http://11.202.5.41:8881/api/v1`,
  }: CustomClientParams) {
    // Since each virtual user & iteration combo is unique, we can in theory keep data throughout the test in the CustomClient
    this.baseUrl = baseUrl;
    this.uniqueId = Math.random().toString(16).slice(2);
  }

  private checkFailedTest({ status, response }: CheckFailedTestParams) {
    if (!status) {
      // `fail` is a simple convenience wrapper on top of JavaScript's `throw`
      // does not abort the test, nor does it make the test exit with non-0 status
      // fail(
      //   `❌ uniqueId:${this.uniqueId}. Unexpected status for "${response.url}", received status ${response.status}.`,
      //   );
      execution.test.abort(
        `❌ uniqueId:${this.uniqueId}. Unexpected status for "${response.url}", received status ${response.status}.`,
      );
    }
  }

  // ------------------------------------------------------------------------------------

  adminLogin(creds: AdminLoginCreds) {
    const url = `${this.baseUrl}/admin/login`;

    // do login
    const response = http.post(url, JSON.stringify(creds), this.params);
    console.log(
      '🚀 ~ file: CustomClient.ts:64 ~ CustomClient ~ adminLogin ~ response:',
      { response, json: response.json() },
    );

    // verify login response
    const status = check(response, {
      'status is 200': (r) => r.status === 200,
      'success is true': (r) =>
        (r.json() as AdminLoginSuccessResponse).success === true,
      'is correct user': (r) =>
        (r.json() as AdminLoginSuccessResponse).data.uid === creds.username,
      'is token exists': (r) =>
        !!(r.json() as AdminLoginSuccessResponse).data.token,
    });

    // check failed test
    this.checkFailedTest({ status, response });

    // assign 'Authorization' bearer token
    const jsonResponse = response.json() as AdminLoginSuccessResponse;
    this.params = {
      headers: {
        ...this.params.headers,
        Authorization: `Bearer ${jsonResponse.data.token}`,
      },
    };

    return jsonResponse;
  }

  adminLogout() {
    const url = `${this.baseUrl}/admin/logout`;

    // do logout
    const response = http.post(url, undefined, this.params);

    // verify logout response
    const status = check(response, {
      'status is 204': (r) => r.status === 204,
    });

    // check failed test
    this.checkFailedTest({ status, response });
  }
}
