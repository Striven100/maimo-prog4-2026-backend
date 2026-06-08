const { getTasks, saveTasks, getSubjects, getUsers, generateId } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.obtenerTareas = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await getTasks();
    const subjects = await getSubjects();
    const users = await getUsers();

    const mySubjects = subjects.filter(s =>
      s.ownerId === userId ||
      (s.collaborators || []).some(c => c.userId === userId)
    );

    const userSubjectIds = mySubjects.map(s => s.id);

    const sharedGroupIds = mySubjects
      .filter(s => s.sharedGroupId)
      .map(s => s.sharedGroupId);

    const allSharedSubjectIds = subjects
      .filter(s => sharedGroupIds.includes(s.sharedGroupId))
      .map(s => s.id);

    const visibleSubjectIds = [...new Set([...userSubjectIds, ...allSharedSubjectIds])];

    const tareas = tasks.filter(t =>
      t.ownerId === userId ||
      visibleSubjectIds.includes(t.subjectId)
    ).map(t => {
      const subject = subjects.find(s => s.id === t.subjectId);
      const creator = t.createdById ? users.find(u => u.id === t.createdById) : null;
      return addId({
        ...t,
        materia: subject ? { _id: subject.id, nombre: subject.nombre, color: subject.color, isShared: subject.isShared } : null,
        createdBy: creator ? { _id: creator.id, name: creator.name, username: creator.username } : null
      });
    });

    res.json(tareas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearTarea = async (req, res) => {
  try {
    const tasks = await getTasks();
    const subjectId = req.body.subjectId || req.body.materia || null;

    let sharedGroupId = null;
    if (subjectId) {
      const subjects = await getSubjects();
      const subject = subjects.find(s => s.id === subjectId);
      if (subject && subject.sharedGroupId) {
        sharedGroupId = subject.sharedGroupId;
      }
    }

    const tarea = {
      id: generateId(),
      ownerId: req.user.id,
      subjectId,
      sharedGroupId,
      titulo: req.body.titulo || '',
      descripcion: req.body.descripcion || '',
      fechaEntrega: req.body.fechaEntrega || null,
      prioridad: req.body.prioridad || 'media',
      tipo: req.body.tipo || 'tarea',
      estado: req.body.estado || 'pendiente',
      createdById: req.user.id,
      createdAt: new Date().toISOString()
    };
    tasks.push(tarea);
    await saveTasks(tasks);
    res.status(201).json(addId(tarea));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const tasks = await getTasks();
    const idx = tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    tasks[idx] = { ...tasks[idx], ...req.body, id: tasks[idx].id };
    if (req.body.materia !== undefined) tasks[idx].subjectId = req.body.materia;
    await saveTasks(tasks);
    res.json(addId(tasks[idx]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const tasks = await getTasks();
    const idx = tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    const oldStatus = tasks[idx].estado;
    tasks[idx].estado = req.body.estado || req.body.status || tasks[idx].estado;
    await saveTasks(tasks);

    if (tasks[idx].estado === 'completada' && oldStatus !== 'completada') {
      const { getUsers, saveUsers } = require('../storage/database');
      const users = await getUsers();
      const user = users.find(u => u.id === tasks[idx].ownerId);
      if (user) {
        user.points = (user.points || 0) + 10;
        user.completedTasks = (user.completedTasks || 0) + 1;
        user.level = Math.floor((user.points || 0) / 100) + 1;
        user.streak = (user.streak || 0) + 1;
        if (!user.achievements) user.achievements = [];
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
      }
    }

    res.json(addId(tasks[idx]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const tasks = await getTasks();
    const idx = tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    tasks.splice(idx, 1);
    await saveTasks(tasks);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
