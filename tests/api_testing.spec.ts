import { test, expect, chromium } from '@playwright/test';
import { request } from 'http';

const baseUrl = 'https://restful-booker.herokuapp.com';
let bookingId: number;
let token: string;
test.beforeEach('login', async ({ request }) => {
    const response = await request.post(`${baseUrl}/auth`, {
        data: {
            "username": "admin",
            "password": "password123"
        }
    });
    const responseBody = await response.json();
    token = responseBody.token;
})
test.beforeEach('get unique id', async ({ request }) => {
    const response = await request.get(`${baseUrl}/booking`);
    const responseBody = await response.json();
    const randomBooking = responseBody[Math.floor(Math.random() * responseBody.length)];
    bookingId = randomBooking.bookingid;
})

test.describe('level 1', () => {
    //1. Get a list of all bookings
    test('get all booking', async ({ request }) => {
        const response = await request.get(`${baseUrl}/booking`);
        console.log(await response.json());
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBeTruthy();
        expect(responseBody.length).toBeGreaterThan(0);
    });

    //2. Get details of a specific booking by ID
    test('get specific booking by id', async ({ request }) => {
        const response = await request.get(`${baseUrl}/booking/${bookingId}`);
        console.log(await response.json());
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('firstname');
        expect(responseBody).toHaveProperty('lastname');
        expect(responseBody).toHaveProperty('totalprice');
        expect(responseBody).toHaveProperty('depositpaid');
        expect(responseBody).toHaveProperty('bookingdates');
    });

    //3. Search bookings by first name/last name
    test('search booking by firstname & lastname', async ({ request }) => {
        const response = await request.get(`${baseUrl}/booking?firstname=Taehyung&lastname=Kim`);
        const bookingIds = await response.json();
        console.log(bookingIds);
        expect(bookingIds.length).toBeGreaterThan(0);
        for (const item of bookingIds) {
            const detailResponse = await request.get(`${baseUrl}/booking/${item.bookingid}`);
            const bookingDetails = await detailResponse.json();
            console.log(bookingDetails);
            expect(bookingDetails).toHaveProperty('firstname', 'Taehyung');
            expect(bookingDetails).toHaveProperty('lastname', 'Kim');
        };
    });
});

test.describe('level 2', () => {
    //4. Create new booking & 5. check response and extract bookingid
    test('create new booking and extract id', async ({ request }) => {
        const response = await request.post(`${baseUrl}/booking`, {
            data: {
                "firstname": "Taehyung",
                "lastname": "Kim",
                "totalprice": 1306,
                "depositpaid": true,
                "bookingdates": {
                    "checkin": "2013-06-13",
                    "checkout": "2013-07-09"
                },
                "additionalneeds": "Breakfast"
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        console.log(responseBody);
        bookingId = responseBody.bookingid;
        console.log(bookingId);
    });

    //6. create an auth token(login)
    test('login', async ({ request }) => {
        const response = await request.post(`${baseUrl}/auth`, {
            data: {
                "username": "admin",
                "password": "password123"
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        token = responseBody.token;
        console.log(token);
    });
});

test.describe('level 3', () => {
    //7. Update a booking using put
    test('update a booking with put', async ({ request }) => {
        const response = await request.put(`${baseUrl}/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: {
                "firstname": "Namjoon",
                "lastname": "Kim",
                "totalprice": 1209,
                "depositpaid": true,
                "bookingdates": {
                    "checkin": "2013-06-13",
                    "checkout": "2013-07-09"
                },
                "additionalneeds": "Breakfast"
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        console.log(await response.json());
    });

    //8. Partially update a booking using patch
    test('update a booking with patch', async ({ request }) => {
        const response = await request.patch(`${baseUrl}/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: {
                "depositpaid": false
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        console.log(await response.json());
    });

    //9. delete a booking
    test('delete a booking', async ({ request }) => {
        const deleteResponse = await request.delete(`${baseUrl}/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
        });
        expect(deleteResponse.ok()).toBeTruthy();
        expect(deleteResponse.status()).toBe(201);
        const getResponse = await request.get(`${baseUrl}/booking/${bookingId}`);
        expect(getResponse.status()).toBe(404);
    });
});

test.describe('level 4', () => {
    //10. try accessing a booking with an invalid id
    test('get nonexist bookingid', async ({ request }) => {
        const response = await request.get(`${baseUrl}/booking/13245678534`);
        expect(response.status()).toBe(404);
    });

    //11. try creating a booking with missing fields
    test('create new booking with missing field', async ({ request }) => {
        const response = await request.post(`${baseUrl}/booking`, {
            data: {
                "lastname": "Kim",
                "totalprice": 1306,
                "depositpaid": true,
                "bookingdates": {
                    "checkin": "2013-06-13",
                    "checkout": "2013-07-09"
                },
                "additionalneeds": "Breakfast"
            }
        });
        expect(response.status()).toBe(500);
    });

    //12. try updating of deleting a booking without authentication
    test('delete without cookie', async ({ request }) => {
        const deleteResponse = await request.delete(`${baseUrl}/booking/${bookingId}`);
        expect(deleteResponse.status()).toBe(403);
    });
})