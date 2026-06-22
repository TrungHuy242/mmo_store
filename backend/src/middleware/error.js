export function notFound(req, res, next) {
  res.status(404).json({ message: `Không tìm thấy: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Lỗi hệ thống',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
