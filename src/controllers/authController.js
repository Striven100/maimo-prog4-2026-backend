const { getUsers, saveUsers, generateId } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const users = await getUsers();

    if (users.some(u => u.name.toLowerCase() === name.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese nombre' });
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese username' });
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    if (users.some(u => u.password === password)) {
      return res.status(400).json({ error: 'Ya existe un usuario con esa contraseña' });
    }

    const newUser = {
      id: generateId(),
      name: name.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      career: '',
      university: '',
      points: 0,
      level: 1,
      streak: 0,
      completedTasks: 0,
      avatar: { base: 'default', outfit: 'basic', accessory: 'none', background: 'standard' },
      friends: [],
      achievements: [],
      unlockedRewards: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: addId(userWithoutPassword) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Ingresa tu usuario, email, nombre o contraseña' });
    }
    const users = await getUsers();
    const trimmed = identifier.trim();

    const user = users.find(u =>
      u.username.toLowerCase() === trimmed.toLowerCase() ||
      u.email.toLowerCase() === trimmed.toLowerCase() ||
      u.name.toLowerCase() === trimmed.toLowerCase() ||
      u.password === identifier
    );

    if (!user) {
      return res.status(404).json({ error: 'No se encontró ninguna cuenta con ese dato.' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: addId(userWithoutPassword) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { password, ...userWithoutPassword } = user;
    res.json({ user: addId(userWithoutPassword) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
