import { check, sleep } from 'k6';
import { Options } from 'k6/options';

/* @ts-ignore */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
/* @ts-ignore */
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';
import http from 'k6/http';

export let options: Options = {
  vus: 50,
  duration: '10s',
};

export default () => {
  const res = http.post('https://httpbin.org/status/400');

  check(res, {
    'status is 400': () => res.status === 400,
  });
  sleep(randomIntBetween(1, 5));
};

// k6 calls handleSummary() at the end of the test lifecycle.
export function handleSummary(data: any) {
  return {
    'post-400-status-test.html': htmlReport(data),
  };
}
