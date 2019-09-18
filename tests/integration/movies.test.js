const request = require('supertest');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let server;

describe('/api/movies', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => {
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        server.close();
    });

    describe('GET /:id', () => {
        it('should return a movie if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre1' });

            const movie = new Movie({
                title: 'movie1', genre, numberInStock: 1, dailyRentalRate: 2
            });
            await movie.save();

            const res = await request(server).get('/api/movies/' + movie._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', movie.title);
            expect(res.body).toHaveProperty('genre.name', genre.name);
            expect(res.body).toHaveProperty('numberInStock', movie.numberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', movie.dailyRentalRate);
        });

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/movies/1');

            expect(res.status).toBe(404);
        });

        it('should return 404 if no movie with the given id exists', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/movies/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /', () => {
        it('should return all movies', async () => {
            const genre1 = new Genre({ name: 'genre1' });
            const genre2 = new Genre({ name: 'genre2' });

            const movies = [
                { title: 'movie1', genre: genre1, numberInStock: 1, dailyRentalRate: 1 },
                { title: 'movie2', genre: genre2, numberInStock: 2, dailyRentalRate: 2 }
            ];

            await Movie.collection.insertMany(movies);

            const res = await request(server).get('/api/movies/');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(m => m.title === 'movie1')).toBeTruthy();
            expect(res.body.some(m => m.title === 'movie2')).toBeTruthy();
            expect(res.body.some(m => m.genre.name === 'genre1')).toBeTruthy();
            expect(res.body.some(m => m.genre.name === 'genre2')).toBeTruthy();
            expect(res.body.some(m => m.numberInStock === 1)).toBeTruthy();
            expect(res.body.some(m => m.numberInStock === 2)).toBeTruthy();
            expect(res.body.some(m => m.dailyRentalRate === 1)).toBeTruthy();
            expect(res.body.some(m => m.dailyRentalRate === 2)).toBeTruthy();
        });
    });

    describe('POST /', () => {

        let token;
        let title, genreId, numberInStock, dailyRentalRate;

        const exec = async () => {
            return await request(server)
                .post('/api/movies')
                .set('x-auth-token', token)
                .send({ title, genreId, numberInStock, dailyRentalRate });
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();
            title = 'movie1';
            let genre = new Genre({
                name: 'genre1'
            });
            await genre.save();
            genreId = genre._id;
            numberInStock = 1;
            dailyRentalRate = 2;
        })

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if title is not included', async () => {
            title = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });


        it('should return 400 if movie is less than 2 characters', async () => {
            title = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie is more than 50 characters', async () => {
            title = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genreId is not included', async () => {
            genreId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre with given genreId is not found', async () => {
            genreId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is not included', async () => {
            numberInStock = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is less than 0', async () => {
            numberInStock = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is greater than 50', async () => {
            numberInStock = 51;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is not included', async () => {
            dailyRentalRate = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is less than 0', async () => {
            dailyRentalRate = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is greater than 50', async () => {
            dailyRentalRate = 51;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the movie if it is valid', async () => {
            await exec();

            const movie = await Movie.find({ title: 'movie1' });

            expect(movie).not.toBeNull();
        });

        it('should return the movie if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', title);
            expect(res.body).toHaveProperty('genre.name', 'genre1');
            expect(res.body).toHaveProperty('numberInStock', numberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', dailyRentalRate);
        });
    });

    describe('PUT /:id', () => {

        let token;
        let movie, movieId;
        let genre, genreId;
        let newTitle, newGenreId, newNumberInStock, newDailyRentalRate;

        const exec = async () => {
            return await request(server)
                .put('/api/movies/' + movieId)
                .set('x-auth-token', token)
                .send({
                    title: newTitle,
                    genreId: newGenreId,
                    numberInStock: newNumberInStock,
                    dailyRentalRate: newDailyRentalRate
                });
        }

        beforeEach(async () => {
            // Save movie to be modified to database
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            genreId = genre._id;

            movie = new Movie({ title: 'movie1', genre, numberInStock: 1, dailyRentalRate: 1 });
            await movie.save();
            movieId = movie._id;

            token = new User().generateAuthToken();
            newTitle = 'updatedTitle';
            let newGenre = new Genre({ name: 'newGenre' });
            newNumberInStock = 2;
            newDailyRentalRate = 2;

            await newGenre.save();
            newGenreId = newGenre._id;
        })

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if title is not included', async () => {
            newTitle = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if title is less than 2 characters', async () => {
            newTitle = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if title is more than 50 characters', async () => {
            newTitle = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genreId is not included', async () => {
            newGenreId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre with given genreId is not found', async () => {
            newGenreId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is not included', async () => {
            newNumberInStock = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is less than 0', async () => {
            newNumberInStock = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock is greater than 50', async () => {
            newNumberInStock = 51;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is not included', async () => {
            newDailyRentalRate = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is less than 0', async () => {
            newDailyRentalRate = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate is greater than 50', async () => {
            newDailyRentalRate = 51;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            movieId = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if movie with given id was not found', async () => {
            movieId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the movie if the given id is valid', async () => {
            await exec();

            const updatedMovie = await Movie.findById(movie._id);

            expect(updatedMovie.title).toBe(newTitle);
        });

        it('should return the updated movie if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', newTitle);
            expect(res.body).toHaveProperty('genre.name', 'newGenre');
            expect(res.body).toHaveProperty('numberInStock', newNumberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', newDailyRentalRate);
        });
    });

    describe('DELETE /:id', () => {
        let id;
        let token;
        let movie, genre;

        const exec = async () => {
            return await request(server)
                .delete('/api/movies/' + id)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            genre = new Genre({ name: 'genre1' });
            movie = new Movie({ title: 'movie1', genre, numberInStock: 1, dailyRentalRate: 1 });
            await movie.save();

            id = movie._id;
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

        it('should return 404 if no movie with the given id was found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the movie if is given id is valid', async () => {
            await exec();

            const movieInDb = await Movie.findById(id);

            expect(movieInDb).toBeNull();
        });

        it('should return the removed movie', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', movie._id.toHexString());
            expect(res.body).toHaveProperty('title', movie.title);
        });
    });
});