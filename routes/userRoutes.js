const express = require('express');
const {
    createUser,
    getUsers,
    updateUser,
    deleteUser,
    explainQuery
} = require('../controllers/userController');

const router = express.Router();

router.route('/explain')
    .get(explainQuery);

router.route('/')
    .post(createUser)
    .get(getUsers);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
