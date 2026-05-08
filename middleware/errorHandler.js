const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds the 10 MB limit.' });
  }

  // Multer file filter error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid item ID.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
};

module.exports = { errorHandler };
