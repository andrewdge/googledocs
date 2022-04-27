import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 5 }, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes.
    { duration: '1m', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(99)<1500'], // 99% of requests must complete below 1.5s
    'login successfully': ['p(99)<1500'], // 99% of requests must complete below 1.5s
    'signup successfully': ['p(99)<1500'],
  },
};

// const BASE_URL = 'http://209.94.59.216';
const BASE_URL = 'http://localhost:8080';
const USERNAME = 'a';
const PASSWORD = 'a';
const EMAIL = 'a@gmail.com'

export default () => {

    const signupRes = http.post(`${BASE_URL}/users/signup`, {
        name: USERNAME,
        password: PASSWORD,
        email: EMAIL,
    });
    
    check(signupRes, {
    'signup successfully': (resp) => resp.status == 200,
    }) || errorRate.add(1);

    const loginRes = http.post(`${BASE_URL}/users/login`, {
        password: PASSWORD,
        email: EMAIL,
    });
    
    check(loginRes, {
        'login successfully': (resp) => resp.json('name') === USERNAME,
    }) || errorRate.add(1);

    // Make sure cookies have been added to VU cookie jar
//   const vuJar = http.cookieJar();
//   const cookiesForURL = vuJar.cookiesForURL(res.url);
//   check(null, {
//     "vu jar has cookie 'name1'": () => cookiesForURL.name1.length > 0,
//     "vu jar has cookie 'name2'": () => cookiesForURL.name2.length > 0,
//   });

  

//   const verifyRes = http.get(`${BASE_URL}/users/verify?username=${username}&key=KEY`);

//   check(verifyRes, {})

//   const authHeaders = {
//     headers: {
//       Authorization: `Bearer ${loginRes.json('access')}`,
//     },
//   };

//   const myObjects = http.get(`${BASE_URL}/home`, authHeaders).json();
//   check(myObjects, { 'retrieved crocodiles': (obj) => obj.length > 0 });

  

  sleep(1);
};
