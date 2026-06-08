const { getUsers, getTasks, saveUsers } = require('../storage/database');

exports.obtenerProgreso = async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const tasks = await getTasks();
    const userTasks = tasks.filter(t => t.ownerId === req.user.id);
    const completadas = userTasks.filter(t => t.estado === 'completada');
    const pendientes = userTasks.filter(t => t.estado !== 'completada');
    const vencidas = userTasks.filter(t =>
      t.estado !== 'completada' && t.fechaEntrega && new Date(t.fechaEntrega) < new Date()
    );

    const progress = {
      points: user.points || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      completedTasks: completadas.length,
      pendingTasks: pendientes.length,
      overdueTasks: vencidas.length,
      totalTasks: userTasks.length,
      progressPercent: userTasks.length > 0
        ? Math.round((completadas.length / userTasks.length) * 100)
        : 0,
      achievements: user.achievements || [],
      unlockedRewards: user.unlockedRewards || []
    };

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completarTarea = async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.points = (user.points || 0) + 10;
    user.completedTasks = (user.completedTasks || 0) + 1;
    user.level = Math.floor((user.points || 0) / 100) + 1;
    user.streak = (user.streak || 0) + 1;

    if (!user.achievements) user.achievements = [];
    if (!user.unlockedRewards) user.unlockedRewards = [];

    if (user.completedTasks === 1 && !user.achievements.includes('Primera tarea completada')) {
      user.achievements.push('Primera tarea completada');
    }
    if (user.completedTasks >= 5 && !user.achievements.includes('5 tareas completadas')) {
      user.achievements.push('5 tareas completadas');
    }
    if (user.completedTasks >= 10 && !user.achievements.includes('10 tareas completadas')) {
      user.achievements.push('10 tareas completadas');
    }

    await saveUsers(users);
    res.json({ user, message: 'Tarea completada y puntos actualizados' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
