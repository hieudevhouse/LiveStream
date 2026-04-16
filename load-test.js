// import http from 'k6/http';
// import { sleep, check } from 'k6';

// export const options = {
//   vus: 1000,
//   duration: '30s'
// };
// export default function () {
//   const payload = JSON.stringify({
//     email: `user_${Date.now()}_${Math.random()}@gmail.com`
//   });

//   const params = {
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   };

//   const res = http.post(
//     'http://127.0.0.1:5000/api/auth/register-auto',
//     payload,
//     params
//   );

//   check(res, {
//     'status ok': (r) => r.status === 200 || r.status === 201
//   });

//   sleep(1);
// }



// import http from 'k6/http';
// import { sleep, check } from 'k6';

// export const options = {
//   vus: 2000,          // số user cùng lúc
//   duration: '44s'    // thời gian test
// };

// export default function () {
//   const payload = JSON.stringify({
//     userId: `user_${__VU}_${__ITER}`,
//     ownershipType: "business",
//     businessName: "Test Company",
//     taxCode: `TAX_${__VU}_${__ITER}`,
//     address: "Hanoi",
//     phone: "0900000000",
//     email: `test_${__VU}_${__ITER}@gmail.com`
//   });

//   const params = {
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   };

//   const res = http.post(
//     'http://127.0.0.1:5000/api/business-owners/upsert',
//     payload,
//     params
//   );

//   check(res, {
//     'status ok': (r) => r.status === 200 || r.status === 201
//   });

//   if (res.status !== 200 && res.status !== 201) {
//   }

//   sleep(1);
// }











import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s'
};

export default function () {

  const payload = JSON.stringify({
    businessOwnerId: "67c1c1a2a1a1a1a1a1a1a1a1",
    name: "Test Product",
    type: "product",
    businessField: "Technology"
  });

  const res = http.post(
    'http://127.0.0.1:5000/api/products-services',
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  console.log("STATUS:", res.status);
  console.log("BODY:", res.body);

  check(res, {
    'status ok': (r) => r.status === 200 || r.status === 201
  });

  sleep(1);
}