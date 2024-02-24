const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "labyrinth",
  database: "grpc",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

exports.query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed Query =>", { text, duration, rows: res.rowCount });
  return res;
};

exports.getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  // set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!");
    console.error(
      `The last executed query on this client was: ${client.lastQuery}`
    );
  }, 5000);
  // monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  client.release = () => {
    // clear our timeout
    clearTimeout(timeout);
    // set the methods back to their old un-monkey-patched version
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
};

/* const { query } = require("./db.js");

(async () => {
  const res = await query(`SELECT NOW() WHERE $1`, [1]);
  console.log(res.rows[0]);
})(); */
