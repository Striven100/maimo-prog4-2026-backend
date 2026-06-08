const { getSubjects, saveSubjects, getTasks, saveTasks, getUsers, generateId } = require('../storage/database');

function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.obtenerMaterias = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjects = await getSubjects();
    const materias = subjects.filter(s =>
      s.ownerId === userId ||
      (s.collaborators || []).some(c => c.userId === userId)
    ).map(addId);
    res.json(materias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerMateria = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const materia = subjects.find(s => s.id === req.params.id);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(addId(materia));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearMateria = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const materia = {
      id: generateId(),
      ownerId: req.user.id,
      nombre: req.body.nombre || '',
      profesor: req.body.profesor || '',
      comision: req.body.comision || '',
      horario: req.body.horario || '',
      color: req.body.color || '#6366f1',
      descripcion: req.body.descripcion || '',
      collaborators: req.body.collaborators || [],
      sharedGroupId: null,
      isShared: false,
      notes: [],
      createdAt: new Date().toISOString()
    };
    subjects.push(materia);
    await saveSubjects(subjects);
    res.status(201).json(addId(materia));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarMateria = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const idx = subjects.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Materia no encontrada' });
    if (subjects[idx].ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el owner puede editar' });
    }
    subjects[idx] = { ...subjects[idx], ...req.body, id: subjects[idx].id, ownerId: subjects[idx].ownerId };
    await saveSubjects(subjects);
    res.json(addId(subjects[idx]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarMateria = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const idx = subjects.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Materia no encontrada' });
    if (subjects[idx].ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el owner puede eliminar' });
    }
    const tasks = await getTasks();
    const remainingTasks = tasks.filter(t => t.subjectId !== req.params.id);
    await saveTasks(remainingTasks);
    subjects.splice(idx, 1);
    await saveSubjects(subjects);
    res.json({ mensaje: 'Materia y tareas asociadas eliminadas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerCombinables = async (req, res) => {
  try {
    const userId = req.user.id;
    const users = await getUsers();
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    const friendIds = currentUser.friends || [];
    if (friendIds.length === 0) return res.json([]);

    const subjects = await getSubjects();
    const mySubjects = subjects.filter(s => s.ownerId === userId && !s.isShared && !s.sharedGroupId);
    const friendSubjects = subjects.filter(s =>
      friendIds.includes(s.ownerId) && !s.isShared && !s.sharedGroupId
    );

    const results = [];
    for (const mine of mySubjects) {
      const myNorm = normalizeName(mine.nombre).slice(0, 3);
      if (!myNorm) continue;
      for (const friend of friendSubjects) {
        const friendNorm = normalizeName(friend.nombre).slice(0, 3);
        if (friendNorm && myNorm === friendNorm) {
          const friendUser = users.find(u => u.id === friend.ownerId);
          const suggested = mine.nombre.length >= friend.nombre.length ? mine.nombre : friend.nombre;
          results.push({
            mySubject: addId({ id: mine.id, nombre: mine.nombre, color: mine.color }),
            friendSubject: addId({ id: friend.id, nombre: friend.nombre, color: friend.color }),
            friend: { id: friend.ownerId, _id: friend.ownerId, name: friendUser?.name || '', username: friendUser?.username || '' },
            suggestedName: suggested,
            match: myNorm
          });
        }
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.combinar = async (req, res) => {
  try {
    const { mySubjectId, friendSubjectId, finalName } = req.body;
    const userId = req.user.id;

    const subjects = await getSubjects();
    const mySubject = subjects.find(s => s.id === mySubjectId && s.ownerId === userId && !s.isShared);
    if (!mySubject) return res.status(404).json({ error: 'Tu materia no fue encontrada o ya está combinada' });

    const friendSubject = subjects.find(s => s.id === friendSubjectId);
    if (!friendSubject) return res.status(404).json({ error: 'Materia del amigo no encontrada' });
    if (friendSubject.isShared) return res.status(400).json({ error: 'La materia del amigo ya está combinada' });

    const users = await getUsers();
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser || !(currentUser.friends || []).includes(friendSubject.ownerId)) {
      return res.status(403).json({ error: 'No eres amigo del dueño de esta materia' });
    }

    const sharedGroupId = generateId();
    const mergeName = finalName || mySubject.nombre;

    mySubject.sharedGroupId = sharedGroupId;
    mySubject.nombre = mergeName;
    mySubject.isShared = true;
    if (!mySubject.collaborators) mySubject.collaborators = [];
    if (!mySubject.collaborators.some(c => c.userId === friendSubject.ownerId)) {
      mySubject.collaborators.push({ userId: friendSubject.ownerId, rol: 'collaborator' });
    }

    friendSubject.sharedGroupId = sharedGroupId;
    friendSubject.nombre = mergeName;
    friendSubject.isShared = true;
    if (!friendSubject.collaborators) friendSubject.collaborators = [];
    if (!friendSubject.collaborators.some(c => c.userId === userId)) {
      friendSubject.collaborators.push({ userId, rol: 'collaborator' });
    }

    await saveSubjects(subjects);

    res.json({
      mySubject: addId(mySubject),
      friendSubject: addId(friendSubject),
      message: 'Materias combinadas exitosamente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.agregarNota = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const materia = subjects.find(s => s.id === req.params.id);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    const userId = req.user.id;
    const canAccess = materia.ownerId === userId ||
      (materia.collaborators || []).some(c => c.userId === userId);
    if (!canAccess) return res.status(403).json({ error: 'No tienes acceso a esta materia' });

    if (!materia.notes) materia.notes = [];
    const note = {
      id: generateId(),
      userId,
      text: req.body.text || '',
      createdAt: new Date().toISOString()
    };
    materia.notes.push(note);
    await saveSubjects(subjects);
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerNotas = async (req, res) => {
  try {
    const subjects = await getSubjects();
    const materia = subjects.find(s => s.id === req.params.id);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    const userId = req.user.id;
    const canAccess = materia.ownerId === userId ||
      (materia.collaborators || []).some(c => c.userId === userId);
    if (!canAccess) return res.status(403).json({ error: 'No tienes acceso a esta materia' });

    let notas = [...(materia.notes || [])];

    if (materia.sharedGroupId) {
      const todasLasNotas = subjects
        .filter(s => s.sharedGroupId === materia.sharedGroupId)
        .flatMap(s => (s.notes || []).map(n => ({ ...n, fromSubjectName: s.nombre })));
      notas = todasLasNotas;
    }

    res.json(notas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
