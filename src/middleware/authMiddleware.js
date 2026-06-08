const { getUsers } = require('../storage/database');

const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = authMiddleware;
