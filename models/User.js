const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [3, 'Name must be at least 3 characters long'],
        index: true // Single field index
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    age: {
        type: Number,
        min: [0, 'Age cannot be negative'],
        max: [120, 'Age cannot exceed 120']
    },
    hobbies: {
        type: [String],
        index: true // Multikey index (because it is an array)
    },
    bio: {
        type: String
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '30d' } // TTL Index: automatically remove after 30 days
    }
});

// Compound index on email and age
userSchema.index({ email: 1, age: -1 });

// Text index on bio
userSchema.index({ bio: 'text' });

// Hashed index on userId
userSchema.index({ userId: 'hashed' });

const User = mongoose.model('User', userSchema);
module.exports = User;
