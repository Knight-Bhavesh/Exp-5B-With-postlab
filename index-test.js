const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { faker } = require('@faker-js/faker');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Testing');
    } catch (error) {
        console.error('Connection Error:', error.message);
        process.exit(1);
    }
};

const runTest = async () => {
    await connectDB();

    try {
        // Clear previous data
        await User.deleteMany({});

        // Insert sample data
        const sampleUsers = [];

        // Generate 197 random users using faker
        for (let i = 0; i < 197; i++) {
            sampleUsers.push({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                age: faker.number.int({ min: 18, max: 80 }),
                hobbies: [faker.word.sample(), faker.word.sample()],
                bio: faker.lorem.sentence(),
                userId: faker.string.uuid()
            });
        }

        await User.insertMany(sampleUsers);
        console.log(`Inserted ${sampleUsers.length} Users into Database (3 fixed + 197 faker)`);

        // Test 1: Single Field Index on Name
        console.log('\\n--- Querying with single field index (name) ---');
        const nameStats = await User.find({ name: "Alice" }).explain("executionStats");
        console.log('Execution Time (ms):', nameStats.executionStats.executionTimeMillis);
        console.log('Total Keys Examined:', nameStats.executionStats.totalKeysExamined);
        console.log('Total Docs Examined:', nameStats.executionStats.totalDocsExamined);

        // Test 2: Compound Index on email and age
        console.log('\\n--- Querying with compound index (email, age) ---');
        const compoundStats = await User.find({ email: "bob@example.com", age: 30 }).explain("executionStats");
        console.log('Execution Time (ms):', compoundStats.executionStats.executionTimeMillis);
        console.log('Total Keys Examined:', compoundStats.executionStats.totalKeysExamined);
        console.log('Total Docs Examined:', compoundStats.executionStats.totalDocsExamined);

        // Test 3: Multikey Index on hobbies
        console.log('\\n--- Querying with multikey index (hobbies) ---');
        const hobbyStats = await User.find({ hobbies: "coding" }).explain("executionStats");
        console.log('Execution Time (ms):', hobbyStats.executionStats.executionTimeMillis);
        console.log('Total Keys Examined:', hobbyStats.executionStats.totalKeysExamined);
        console.log('Total Docs Examined:', hobbyStats.executionStats.totalDocsExamined);

        // Test 4: Text index on bio
        console.log('\\n--- Querying with text index (bio) ---');
        const textStats = await User.find({ $text: { $search: "developer" } }).explain("executionStats");
        console.log('Execution Time (ms):', textStats.executionStats.executionTimeMillis);
        console.log('Total Keys Examined:', textStats.executionStats.totalKeysExamined);
        console.log('Total Docs Examined:', textStats.executionStats.totalDocsExamined);

    } catch (err) {
        console.error('Error during testing:', err);
    } finally {
        mongoose.connection.close();
        console.log('\\nDatabase connection closed.');
    }
};

runTest();
