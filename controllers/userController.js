const User = require('../models/User');

// @desc    Create a new user
// @route   POST /api/users
exports.createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        // Handle Duplicate key error (e.g. email)
        if (error.code === 11000) {
             const field = Object.keys(error.keyValue)[0];
             return res.status(400).json({ success: false, error: `Duplicate field value entered for ${field}` });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all users (with querying, filtering, sorting, pagination)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        let query;
        const reqQuery = { ...req.query };

        // Fields to exclude from standard filtering
        const removeFields = ['select', 'sort', 'page', 'limit', 'bioSearch'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Stringify query to create operators ($gt, $gte, etc) if needed
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        
        let parsedQuery = JSON.parse(queryStr);

        // Text search on bio
        if (req.query.bioSearch) {
            parsedQuery.$text = { $search: req.query.bioSearch };
        }

        // Handle array for hobbies if comma-separated
        if (reqQuery.hobbies) {
            parsedQuery.hobbies = { $in: reqQuery.hobbies.split(',') };
        }

        query = User.find(parsedQuery);

        // Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        query = query.skip(skip).limit(limit);

        // Execute query
        const users = await query;

        res.status(200).json({
            success: true,
            count: users.length,
            pagination: { page, limit },
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Explain Query for Index Testing
// @route   GET /api/users/explain
exports.explainQuery = async (req, res) => {
    try {
        let parsedQuery = {};
        
        // Build query fields from req.query identically to getUsers,
        // but skipping pagination/sort to focus on index usage of find()
        // Example: ?email=test@example.com&age=25
        
        const reqQuery = { ...req.query };
        if (reqQuery.email) parsedQuery.email = reqQuery.email;
        if (reqQuery.age) parsedQuery.age = parseInt(reqQuery.age);

        // Use find().explain("executionStats")
        const stats = await User.find(parsedQuery).explain("executionStats");
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
