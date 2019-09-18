const request = require('supertest'); // allows us to request server
const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let server;

describe('/api/returns', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => {
        await Customer.deleteMany({});
        server.close();
    });

    describe('POST /', () => {
        let token;
        let name, phone, isGold;

        beforeEach(async () => {
            token = new User().generateAuthToken();

            name = '12';
            phone = '12';
            isGold = false;
        });

        const exec = async () => {
            return await request(server)
                .post('/api/customers')
                .set('x-auth-token', token)
                .send({ name, phone, isGold });
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if name is not provided', async () => {
            name = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if name is less than 2 characters', async () => {
            name = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if name is greater than 50 characters', async () => {
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is not provided', async () => {
            phone = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is less than 2 characters', async () => {
            phone = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is greater than 50 characters', async () => {
            phone = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 200 if given valid customer', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the customer if input is valid', async () => {
            const res = await exec();

            // Object.keys returns array of all properties
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                '_id', 'name', 'phone', 'isGold'
            ]));
        });
    });

    describe('PUT /id', () => {
        let token;
        let id;
        let customer;
        let newName, newPhone, newIsGold;

        beforeEach(async () => {
            customer = new Customer({
                name: '12',
                phone: '12',
                isGold: false
            });
            await customer.save();

            token = new User().generateAuthToken();
            id = customer._id;
            newName = 'updatedName';
            newPhone = 'updatedPhone';
            newIsGold = true;
        });

        const exec = async () => {
            return await request(server)
                .put('/api/customers/' + id)
                .set('x-auth-token', token)
                .send({ name: newName, phone: newPhone, isGold: newIsGold });
        }

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if name is not provided', async () => {
            newName = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if name is less than 2 characters', async () => {
            newName = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if name is greater than 50 characters', async () => {
            newName = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is not provided', async () => {
            newPhone = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is less than 2 characters', async () => {
            newPhone = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if phone is greater than 50 characters', async () => {
            newPhone = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if customer with given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the customer if the given id is valid', async () => {
            await exec();

            const updatedCustomer = await Customer.findById(customer._id);

            expect(updatedCustomer.name).toBe(newName);
            expect(updatedCustomer.phone).toBe(newPhone);
            expect(updatedCustomer.isGold).toBe(newIsGold);
        });

        it('should return 200 if given valid customer id', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the customer if input is valid', async () => {
            const res = await exec();

            // Object.keys returns array of all properties
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                '_id', 'name', 'phone', 'isGold'
            ]));
        });
    });

    describe('GET /', () => {
        it('should return all customers', async () => {
            const customers = [
                { name: 'name1', phone: 'phone1', isGold: false },
                { name: 'name2', phone: 'phone2', isGold: true }
            ];

            await Customer.collection.insertMany(customers);

            const res = await request(server).get('/api/customers/');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(m => m.name === 'name1')).toBeTruthy();
            expect(res.body.some(m => m.name === 'name2')).toBeTruthy();
            expect(res.body.some(m => m.phone === 'phone1')).toBeTruthy();
            expect(res.body.some(m => m.phone === 'phone2')).toBeTruthy();
            expect(res.body.some(m => m.isGold === false)).toBeTruthy();
            expect(res.body.some(m => m.isGold === true)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return a customer if valid id is passed', async () => {
            const customer = new Customer({
                name: 'name1', phone: 'phone1', isGold: false
            });
            await customer.save();

            const res = await request(server).get('/api/customers/' + customer._id);

            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                '_id', 'name', 'phone', 'isGold'
            ]));
        });

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/customers/1');

            expect(res.status).toBe(404);
        });

        it('should return 404 if no customer with the given id exists', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/customers/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /:id', () => {
        let id;
        let token;
        let customer;

        const exec = async () => {
            return await request(server)
                .delete('/api/customers/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            customer = new Customer({
                name: 'name1', phone: 'phone1', isGold: false
            });
            await customer.save();

            id = customer._id;
            token = new User({ isAdmin: true }).generateAuthToken();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if the user is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if given id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no customer with the given id was found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the customer if is given id is valid', async () => {
            await exec();

            const customerInDb = await Customer.findById(id);

            expect(customerInDb).toBeNull();
        });

        it('should return the removed customer', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', customer._id.toHexString());
            expect(res.body).toHaveProperty('name', customer.name);
            expect(res.body).toHaveProperty('phone', customer.phone);
            expect(res.body).toHaveProperty('isGold', customer.isGold);
        });
    });
});