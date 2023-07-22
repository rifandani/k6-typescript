import { check, sleep } from 'k6';
import execution from 'k6/execution';
import http from 'k6/http';
import { Options } from 'k6/options';
import { AdminLoginSuccessResponse } from './helpers/CustomClient';

// init
const baseUrl = `http://11.202.5.41:8881/api/v1`;
const usernames = ['tesla', 'gauss', 'einstein', 'faraday'];
const password = 'password';
const workingUrl = 'https://httpbin.test.k6.io/post';
const workingData = { name: 'Bert' };

// options
export let options: Options = {
  vus: usernames.length,
  duration: `${usernames.length * 10}s`,
};

// vus
export default (): void => {
  usernames.forEach((username) => {
    // const client = new CustomClient({});
    const loginCreds = { username, password };

    // do login
    // client.adminLogin(loginCreds);
    const response = http.post(
      // `${baseUrl}/admin/login`,
      // JSON.stringify(loginCreds),
      workingUrl,
      JSON.stringify(workingData),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    console.log(
      '🚀 ~ file: admin-auth-smoke-test.ts:38 ~ usernames.forEach ~ response:',
      response,
    );

    // verify login response
    const status = check(response, {
      'status is 200': (r) => r.status === 200,
      'success is true': (r) =>
        (r.json() as AdminLoginSuccessResponse).success === true,
      'is correct user': (r) =>
        (r.json() as AdminLoginSuccessResponse).data.uid ===
        loginCreds.username,
      'is token exists': (r) =>
        !!(r.json() as AdminLoginSuccessResponse).data.token,
    });

    // check failed test
    // this.checkFailedTest({ status, response });
    if (!status) {
      execution.test.abort(
        `❌ LOGIN_ERROR. Unexpected status for "${response.url}", received status ${response.status}.`,
      );
    }

    // assign 'Authorization' bearer token
    const jsonResponse = response.json() as AdminLoginSuccessResponse;

    sleep(0.5);

    // do logout
    // client.adminLogout();
    const logoutResponse = http.post(`${baseUrl}/admin/logout`, undefined, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jsonResponse.data.token}`,
      },
    });

    console.log(
      '🚀 ~ file: admin-auth-smoke-test.ts:73 ~ usernames.forEach ~ logoutResponse:',
      logoutResponse,
    );

    const logoutStatus = check(logoutResponse, {
      'status is 204': (r) => r.status === 204,
    });

    if (!logoutStatus) {
      execution.test.abort(
        `❌ LOGOUT_ERROR. Unexpected status for "${logoutResponse.url}", received status ${logoutResponse.status}.`,
      );
    }

    sleep(0.5);
  });
};
