import { check, sleep } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';

export let options: Options = {
  vus: 50,
  duration: '10s',
};

export default () => {
  const res = http.get('https://test-api.k6.io');

  check(res, {
    'status is 200': () => res.status === 200,
  });
  sleep(1);
};
