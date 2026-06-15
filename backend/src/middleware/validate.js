// Middleware validate dung zod schema
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ message: 'Du lieu khong hop le', errors });
    }
    req.body = result.data;
    next();
  };
}
