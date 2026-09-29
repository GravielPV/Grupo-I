import { MongoClient } from 'mongodb';

export async function openMongoDatabase({ mongoUri, mongoDatabase }) {
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 20 });
  try {
    await client.connect();
    const db = client.db(mongoDatabase);
    await db.command({ ping: 1 });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    for (const name of ['users', 'products', 'categories', 'movements']) {
      await db.collection(name).createIndex({ id: 1 }, { unique: true });
    }
    await db.collection('sessions').createIndex({ token_hash: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('sessions').createIndex({ user_id: 1 });
    await db.collection('categories').createIndex({ key: 1 }, { unique: true });
    await db.collection('movements').createIndex({ 'product.id': 1, id: -1 });
    await db.collection('locks').updateOne({ _id: 'writes' }, { $setOnInsert: { version: 0 } }, { upsert: true });
    function store(session) {
      const options = session ? { session } : {};
      const collection = (name) => db.collection(name);
      const find = (name, filter) => collection(name).findOne(filter, options);
      const remove = (name, filter) => collection(name).deleteMany(filter, options);
      const list = (name, filter = {}, sort = { id: 1 }) => collection(name).find(filter, options).sort(sort).toArray();
      const insert = async (name, data) => {
        const counter = await collection('counters').findOneAndUpdate({ _id: name }, { $inc: { value: 1 } }, { ...options, upsert: true, returnDocument: 'after' });
        const row = { ...data, id: counter.value, created_at: new Date().toISOString() };
        await collection(name).insertOne(row, options);
        return { lastInsertRowid: row.id };
      };
      return {
        health: () => db.command({ ping: 1 }),
        userByUsername: (username) => find('users', { username }),
        userById: (id) => find('users', { id }),
        userRole: (id) => find('users', { id }),
        listUsers: () => list('users'),
        adminCount: async () => ({ total: await collection('users').countDocuments({ role: 'admin' }, options) }),
        insertUser: (name, username, password_hash, role) => insert('users', { name, username, password_hash, role }),
        updateUser: (name, username, role, password_hash, id) => collection('users').updateOne({ id }, { $set: { name, username, role, password_hash } }, options),
        async deleteUser(id) { await remove('sessions', { user_id: id }); await remove('users', { id }); },
        revokeSessions: (user_id) => remove('sessions', { user_id }),
        purgeSessions: (time) => remove('sessions', { expires_at: { $lte: time } }),
        createSession: (token_hash, user_id, expires_at) => collection('sessions').insertOne({ token_hash, user_id, expires_at, expiresAt: new Date(expires_at) }, options),
        deleteSession: (token_hash) => remove('sessions', { token_hash }),
        async sessionUser(token_hash, time) {
          const row = await find('sessions', { token_hash, expires_at: { $gt: time } });
          return row ? find('users', { id: row.user_id }) : null;
        },
        listProducts: () => list('products', {}, { id: -1 }),
        productById: (id) => find('products', { id }),
        insertProduct: (name, category, price_cents, stock, expiration_date) => insert('products', { name, category, price_cents, stock, expiration_date, updated_at: new Date().toISOString() }),
        updateProduct: (name, category, price_cents, stock, expiration_date, id) => collection('products').updateOne({ id }, { $set: { name, category, price_cents, stock, expiration_date, updated_at: new Date().toISOString() } }, options),
        deleteProduct: (id) => remove('products', { id }),
        listCategories: () => list('categories'),
        categoryById: (id) => find('categories', { id }),
        insertCategory: (name) => insert('categories', { name, key: name.toLocaleLowerCase() }),
        deleteCategory: (id) => remove('categories', { id }),
        categoryInUse: (name) => find('products', { category: name }),
        listMovements: (productId) => list('movements', productId ? { 'product.id': productId } : {}, { id: -1 }),
        insertMovement: (data) => insert('movements', data),
        setStock: (id, stock) => collection('products').updateOne({ id }, { $set: { stock, updated_at: new Date().toISOString() } }, options),
        async transaction(work) {
          const transactionSession = client.startSession();
          try {
            return await transactionSession.withTransaction(async () => {
              // A shared write prevents concurrent changes from bypassing cross-document invariants.
              await collection('locks').updateOne({ _id: 'writes' }, { $inc: { version: 1 } }, { session: transactionSession });
              return work(store(transactionSession));
            });
          } finally { await transactionSession.endSession(); }
        },
        close: () => client.close(),
      };
    }
    return store();
  } catch (error) { await client.close(); throw error; }
}
