const express = require('express');
const appController = require('../controller/app.controller');

const router = express.Router();

router.get('/update-info', appController.getUpdateInfo);

module.exports = router;
