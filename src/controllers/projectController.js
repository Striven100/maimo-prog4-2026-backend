const { getProjects, saveProjects, generateId } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.obtenerProyectos = async (req, res) => {
  try {
    const projects = await getProjects();
    const userId = req.user.id;
    const result = projects.filter(p => p.ownerId === userId || (p.members || []).includes(userId)).map(addId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearProyecto = async (req, res) => {
  try {
    const projects = await getProjects();
    const project = {
      id: generateId(),
      ownerId: req.user.id,
      title: req.body.title || '',
      description: req.body.description || '',
      members: req.body.members || [],
      createdAt: new Date().toISOString()
    };
    projects.push(project);
    await saveProjects(projects);
    res.status(201).json(addId(project));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
