const request = require('supertest');
const { Rental } = require('../../models/rental');
const { Genre } = require('../../models/genre');
const { Movie } = require('../../models/movie');
const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let server;

/*** INCOMPLETE ***/

describe('/api/rentals', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => {
        await Rental.deleteMany({});
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        await Customer.deleteMany({});
        server.close();
    });

    describe('POST /', () => {

        let token;
        let movieId, customerId;
        let movie, customer;

        const exec = async () => {
            return await request(server)
                .post('/api/rentals')
                .set('x-auth-token', token)
                .send({ movieId, customerId });
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();
            let genre = new Genre({ name: 'genre' });
            await genre.save();

            movie = new Movie({
                title: 'title',
                genre,
                numberInStock: 1,
                dailyRentalRate: 1
            });
            await movie.save();
            movieId = movie._id;

            customer = new Customer({
                name: 'name',
                phone: 'phone',
                isGold: false
            });
            await customer.save();
            customerId = customer._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if movieId is not included', async () => {
            movieId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre with given movieId is not found', async () => {
            movieId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if given movie is not in stock', async () => {
            await Movie.findByIdAndUpdate(
                movieId,
                { numberInStock: 0 }
            );

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customerId is not included', async () => {
            customerId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre with given customerId is not found', async () => {
            customerId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the rental if input is valid', async () => {
            await exec();

            const rentalInDb = await Rental.find({ movieId, customerId });

            expect(rentalInDb).not.toBeNull();
        });

        it('should set dateOut on the rental object if input is valid', async () => {
            const res = await exec();

            const resDateOut = new Date(res.body.dateOut);
            const diffInMs = Date.now() - resDateOut;

            expect(diffInMs).toBeLessThan(10 * 1000); // 10 seconds
        });

        it('should return the rental if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('movie._id', movieId.toHexString());
            expect(res.body).toHaveProperty('customer._id', customerId.toHexString());
            expect(res.body).toHaveProperty('dateOut');
        });
    });

    // describe('GET /', () => {
    //     it('should return all rentals', async () => {
    //         const customer1 = new Customer(
    //             { name: 'name1', phone: 'phone1', isGold: false }
    //         );
    //         await customer1.save();
    //         const customer2 = new Customer(
    //             { name: 'name2', phone: 'phone2', isGold: true }
    //         );
    //         await customer2.save();

    //         const genre1 = new Genre(
    //             { name: 'genre1' }
    //         );
    //         await genre1.save();
    //         const genre2 = new Genre(
    //             { name: 'genre2' }
    //         )
    //         await genre2.save();

    //         const movie1 = new Movie({
    //             title: 'title1', genre: genre1, numberInStock: 1, dailyRentalRate: 1
    //         });
    //         await movie1.save();
    //         const movie2 = new Movie(
    //             { title: 'title2', genre: genre2, numberInStock: 2, dailyRentalRate: 2 }
    //         );
    //         await movie2.save();

    //         await Customer.collection.insertOne(customer1);
    //         await Customer.collection.insertOne(customer2);

    //         await Genre.collection.insertOne(genre1);
    //         await Genre.collection.insertOne(genre2);

    //         await Movie.collection.insertOne(movie1);
    //         await Movie.collection.insertOne(movie2);

    //         customerIds = [
    //             Customer.find({ name: 'name1' })._id,
    //             Customer.find({ name: 'name2' })._id
    //         ];
    //         movieIds = [
    //             Movie.find({ title: 'title1' })._id,
    //             Movie.find({ title: 'title2' })._id
    //         ];

    //         const rentals = [
    //             { customerId: customerIds[0], movieId: movieIds[0] },
    //             { customerId: customerIds[1], movieId: movieIds[1] }
    //         ];

    //         await Rental.collection.insertMany(rentals);

    //         const resMovies = await request(server).get('/api/movies');
    //         console.log(resMovies.body);

    //         const res = await request(server).get('/api/rentals');
    //         console.log(res.body);
    //         expect(res.status).toBe(200);
    //         expect(res.body.length).toBe(2);
    //         expect(res.body.some(r => r.movieId === movieIds[0])).toBeTruthy();
    //         expect(res.body.some(r => r.movieId === movieIds[1])).toBeTruthy();
    //     });
    // });
});