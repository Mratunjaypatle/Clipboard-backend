const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getItems, getItemById, createItem, updateItem, deleteItem,
} = require('../controllers/itemController');

// All item routes require authentication
router.use(protect);

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', upload.single('file'), createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
