import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '30s' },
        { target: 40, duration: '30s' },
        { target: 5, duration: '15s' },
        { target: 0, duration: '15s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response

  const vars = {}

  group('Login and order - https://pizza.puroguramu.click/', function () {
    // Login
    response = http.put(
      'https://pizza-service.puroguramu.click/api/auth',
      '{"email":"d@jwt.com","password":"diner"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          origin: 'https://pizza.puroguramu.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }

    vars['token1'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(3)

    // Menu
    response = http.get('https://pizza-service.puroguramu.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        origin: 'https://pizza.puroguramu.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    vars['title1'] = jsonpath.query(response.json(), '$[4].title')[0]

    // Franchise
    response = http.get(
      'https://pizza-service.puroguramu.click/api/franchise?page=0&limit=20&name=*',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.puroguramu.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    sleep(3)

    // Me
    response = http.get('https://pizza-service.puroguramu.click/api/user/me', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        authorization: `Bearer ${vars['token1']}`,
        'content-type': 'application/json',
        origin: 'https://pizza.puroguramu.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(3)

    // Buy the Charred Leopard
    response = http.post(
      'https://pizza-service.puroguramu.click/api/order',
      `{"items":[{"menuId":5,"description":"${vars['title1']}","price":0.0099}],"storeId":"1","franchiseId":1}`,
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.puroguramu.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )

    if (!check(response, { 'status equals 200': (response) => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Order response was *not* 200');
    }
    
    sleep(3)

    vars['jwt'] = jsonpath.query(response.json(), '$.jwt')[0]

console.log(`jwt: ${vars['jwt']}`)

    // Verify JWT
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
        JSON.stringify({ jwt: vars['jwt']}),
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${vars['token1']}`,
          'content-type': 'application/json',
          origin: 'https://pizza.puroguramu.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154", "Not A(Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-storage-access': 'active',
        },
      }
    )
  })
}
