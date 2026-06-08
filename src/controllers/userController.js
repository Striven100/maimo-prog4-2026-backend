const { getUsers, getPreferences } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.buscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query;
    let users = await getUsers();
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term)
      );
    }
    const results = users.map(({ password, ...rest }) => addId(rest));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerUsuario = async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { password, ...userWithoutPassword } = user;
    res.json({ user: addId(userWithoutPassword) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { getUsers, saveUsers } = require('../storage/database');
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
    await saveUsers(users);
    const { password, ...userWithoutPassword } = users[idx];
    res.json({ user: addId(userWithoutPassword) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.usuariosDisponibles = async (req, res) => {
  try {
    const users = await getUsers();
    const userId = req.params.userId;
    const results = users
      .filter(u => u.id !== userId)
      .map(({ password, ...rest }) => addId(rest));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPreferencias = async (req, res) => {
  try {
    const preferences = await getPreferences();
    const pref = preferences.find(p => p.userId === req.params.userId) || {};
    res.json(pref);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarPreferencias = async (req, res) => {
  try {
    const { getPreferences, savePreferences } = require('../storage/database');
    const preferences = await getPreferences();
    const idx = preferences.findIndex(p => p.userId === req.params.userId);
    const data = { ...req.body, userId: req.params.userId };
    if (idx === -1) {
      preferences.push(data);
    } else {
      preferences[idx] = { ...preferences[idx], ...data };
    }
    await savePreferences(preferences);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
