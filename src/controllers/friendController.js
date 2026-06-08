const { getUsers, saveUsers, getFriendRequests, saveFriendRequests, generateId } = require('../storage/database');

function addId(obj) {
  return { ...obj, _id: obj.id };
}

exports.obtenerAmigos = async (req, res) => {
  try {
    const users = await getUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    if (!currentUser) return res.json([]);
    const friendIds = currentUser.friends || [];
    const amigos = users.filter(u => friendIds.includes(u.id))
      .map(({ password, ...rest }) => addId(rest));
    res.json(amigos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.buscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;
    const users = await getUsers();
    const friendRequests = await getFriendRequests();
    const currentUser = users.find(u => u.id === userId);
    const friendIds = currentUser?.friends || [];

    let filtered = users.filter(u => u.id !== userId && !friendIds.includes(u.id));

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    const result = filtered.map(u => {
      let friendshipStatus = 'none';
      const hasSent = friendRequests.some(r =>
        r.fromUserId === userId && r.toUserId === u.id && r.status === 'pending'
      );
      const hasReceived = friendRequests.some(r =>
        r.fromUserId === u.id && r.toUserId === userId && r.status === 'pending'
      );
      if (hasSent) friendshipStatus = 'pending_sent';
      else if (hasReceived) friendshipStatus = 'pending_received';
      const { password, ...rest } = u;
      return addId({ ...rest, friendshipStatus });
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enviarSolicitud = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username requerido' });

    const users = await getUsers();
    const receptor = users.find(u => u.username === username.trim());
    if (!receptor) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (receptor.id === req.user.id) return res.status(400).json({ error: 'No puedes enviarte solicitud a ti mismo' });

    const currentUser = users.find(u => u.id === req.user.id);
    if ((currentUser.friends || []).includes(receptor.id)) {
      return res.status(400).json({ error: 'Ya son amigos' });
    }

    const friendRequests = await getFriendRequests();
    const existe = friendRequests.some(r =>
      (r.fromUserId === req.user.id && r.toUserId === receptor.id && r.status === 'pending') ||
      (r.fromUserId === receptor.id && r.toUserId === req.user.id && r.status === 'pending')
    );
    if (existe) return res.status(400).json({ error: 'Ya existe una solicitud pendiente' });

    const solicitud = {
      id: generateId(),
      fromUserId: req.user.id,
      toUserId: receptor.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    friendRequests.push(solicitud);
    await saveFriendRequests(friendRequests);

    res.status(201).json(addId(solicitud));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.responderSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion } = req.body;

    if (!['aceptar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'Acción inválida. Usar "aceptar" o "rechazar"' });
    }

    const friendRequests = await getFriendRequests();
    const solicitud = friendRequests.find(r => r.id === id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.toUserId !== req.user.id) return res.status(403).json({ error: 'No eres el receptor' });

    solicitud.status = accion === 'aceptar' ? 'accepted' : 'rejected';
    await saveFriendRequests(friendRequests);

    if (accion === 'aceptar') {
      const users = await getUsers();
      const fromUser = users.find(u => u.id === solicitud.fromUserId);
      const toUser = users.find(u => u.id === solicitud.toUserId);
      if (fromUser && toUser) {
        if (!fromUser.friends) fromUser.friends = [];
        if (!toUser.friends) toUser.friends = [];
        if (!fromUser.friends.includes(toUser.id)) fromUser.friends.push(toUser.id);
        if (!toUser.friends.includes(fromUser.id)) toUser.friends.push(fromUser.id);
        await saveUsers(users);
      }
    }

    res.json(addId(solicitud));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const friendRequests = await getFriendRequests();
    const users = await getUsers();
    const solicitudes = friendRequests
      .filter(r => r.toUserId === req.user.id && r.status === 'pending')
      .map(r => {
        const emisor = users.find(u => u.id === r.fromUserId);
        const { password, ...emisorWithoutPass } = emisor || {};
        return addId({ ...r, emisor: addId(emisorWithoutPass) });
      });
    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
