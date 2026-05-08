const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');

const buildFileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

const deleteFile = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filename = fileUrl.split('/uploads/')[1];
    if (!filename) return;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to delete file:', err.message);
  }
};

// GET /api/items  — only items belonging to the logged-in user
const getItems = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const query = { owner: req.user.id };

    if (type && ['text', 'image', 'pdf'].includes(type)) {
      query.type = type;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { textContent: regex },
        { tags: regex },
        { type: regex },
      ];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// POST /api/items
const createItem = async (req, res, next) => {
  try {
    const { title, type, textContent, tags } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ error: 'Title is required.' });
    if (!type || !['text', 'image', 'pdf'].includes(type))
      return res.status(400).json({ error: 'Type must be text, image, or pdf.' });

    const itemData = {
      title: title.trim(),
      type,
      owner: req.user.id,
      tags: tags
        ? typeof tags === 'string'
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : tags
        : [],
    };

    if (type === 'text') {
      if (!textContent || !textContent.trim())
        return res.status(400).json({ error: 'Text content is required for text items.' });
      itemData.textContent = textContent.trim();
    } else {
      if (!req.file)
        return res.status(400).json({ error: `A file is required for ${type} items.` });
      itemData.fileUrl = buildFileUrl(req, req.file.filename);
      itemData.fileName = req.file.originalname;
      itemData.mimeType = req.file.mimetype;
      itemData.fileSize = req.file.size;
    }

    const item = await Item.create(itemData);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (req.file) deleteFile(`/uploads/${req.file.filename}`);
    next(err);
  }
};

// PUT /api/items/:id
const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const { title, textContent, tags } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
      item.title = title.trim();
    }
    if (item.type === 'text' && textContent !== undefined) {
      item.textContent = textContent;
    }
    if (tags !== undefined) {
      item.tags =
        typeof tags === 'string'
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : tags;
    }

    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    if (item.fileUrl) deleteFile(item.fileUrl);
    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem };
