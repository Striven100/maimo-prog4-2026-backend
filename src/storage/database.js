const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

const INITIAL = {
  users: [],
  subjects: [],
  tasks: [],
  friendRequests: [],
  notifications: [],
  preferences: [],
  projects: []
};

let cache = null;

async function ensureDataDir() {
  if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function readDatabase() {
  await ensureDataDir();
  if (cache) return JSON.parse(JSON.stringify(cache));
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    cache = JSON.parse(data);
    return JSON.parse(JSON.stringify(cache));
  } catch {
    cache = JSON.parse(JSON.stringify(INITIAL));
    await writeDatabase(cache);
    return JSON.parse(JSON.stringify(cache));
  }
}

async function writeDatabase(data) {
  await ensureDataDir();
  cache = JSON.parse(JSON.stringify(data));
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function getUsers() { const db = await readDatabase(); return db.users; }
async function saveUsers(users) { const db = await readDatabase(); db.users = users; await writeDatabase(db); }

async function getSubjects() { const db = await readDatabase(); return db.subjects; }
async function saveSubjects(subjects) { const db = await readDatabase(); db.subjects = subjects; await writeDatabase(db); }

async function getTasks() { const db = await readDatabase(); return db.tasks; }
async function saveTasks(tasks) { const db = await readDatabase(); db.tasks = tasks; await writeDatabase(db); }

async function getFriendRequests() { const db = await readDatabase(); return db.friendRequests; }
async function saveFriendRequests(friendRequests) { const db = await readDatabase(); db.friendRequests = friendRequests; await writeDatabase(db); }

async function getNotifications() { const db = await readDatabase(); return db.notifications; }
async function saveNotifications(notifications) { const db = await readDatabase(); db.notifications = notifications; await writeDatabase(db); }

async function getPreferences() { const db = await readDatabase(); return db.preferences; }
async function savePreferences(preferences) { const db = await readDatabase(); db.preferences = preferences; await writeDatabase(db); }

async function getProjects() { const db = await readDatabase(); return db.projects; }
async function saveProjects(projects) { const db = await readDatabase(); db.projects = projects; await writeDatabase(db); }

async function createNotification(userId, type, title, message) {
  const notifications = await getNotifications();
  const notification = {
    id: generateId(),
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  await saveNotifications(notifications);
  return notification;
}

module.exports = {
  readDatabase, writeDatabase, generateId,
  getUsers, saveUsers,
  getSubjects, saveSubjects,
  getTasks, saveTasks,
  getFriendRequests, saveFriendRequests,
  getNotifications, saveNotifications,
  getPreferences, savePreferences,
  getProjects, saveProjects,
  createNotification
};
