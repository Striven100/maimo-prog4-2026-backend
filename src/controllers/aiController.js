exports.sugerir = async (req, res) => {
  try {
    res.json({
      suggestions: [
        'Prioriza las tareas con fecha de entrega más cercana',
        'Divide las tareas grandes en subtareas más pequeñas',
        'Revisa las materias combinables con tus amigos'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
