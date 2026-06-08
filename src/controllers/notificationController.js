const { getNotifications, saveNotifications, generateId } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.obtenerNotificaciones = async (req, res) => {
  try {
    const notifications = await getNotifications();
    const notis = notifications.filter(n => n.userId === req.user.id).map(addId);
    res.json(notis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearNotificacion = async (req, res) => {
  try {
    const notifications = await getNotifications();
    const noti = {
      id: generateId(),
      userId: req.body.userId,
      type: req.body.type || 'info',
      title: req.body.title || '',
      message: req.body.message || '',
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(noti);
    await saveNotifications(notifications);
    res.status(201).json(addId(noti));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const notifications = await getNotifications();
    const idx = notifications.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Notificación no encontrada' });
    notifications[idx].read = true;
    await saveNotifications(notifications);
    res.json(addId(notifications[idx]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
