/* eslint-disable camelcase */
const { Pool } = require("pg");

// PG database client/connection setup
const dbParams = require("../lib/db.js");
const db = new Pool(dbParams);
db.connect();

const getAllItems = function() {
  return db
    .query(`SELECT * FROM items;`)
    .then(result => {
      return result.rows;
    })
    .catch(err => console.log(err.message));
};
exports.getAllItems = getAllItems;

const addNewItem = function(name, price, description, img_url, tag) {
  const values = [name, price, description, img_url, tag];
  return db
    .query(
      `
    INSERT INTO items (name,price,description,img_url,tag)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;`,
      values
    )
    .then(result => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.addNewItem = addNewItem;

const updateItem = function(
  name,
  price,
  description,
  img_url,
  tag,
  originalName
) {
  const values = [name, price, description, img_url, tag, originalName];
  return db
    .query(
      `
    UPDATE items
    SET name = $1,
    price = $2,
    description = $3,
    img_url = $4,
    tag = $5
    WHERE name = $6;`,
      values
    )
    .then(() => {
      return true;
    })
    .catch(err => console.log(err.message));
};
exports.updateItem = updateItem;

const deleteItem = function(name) {
  const values = [name];
  return db
    .query(
      `
    DELETE FROM items
    WHERE name = $1
    RETURNING *;`,
      values
    )
    .then(result => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.deleteItem = deleteItem;

const acceptOrRejectOrder = function(status, order_no) {
  queryParams = [];
  let queryString = `UPDATE orders SET status = $1 WHERE status = $2 AND order_number = $3;`;
  if (status === "rejected") {
    queryParams.push("rejected", "pending");
  }
  if (status === "accepted") {
    queryParams.push("accepted", "pending");
  }
  queryParams.push(order_no);
  return db
    .query(queryString, queryParams)
    .then(() => {
      return true;
    })
    .catch(err => console.log(err.message));
};
exports.acceptOrRejectOrder = acceptOrRejectOrder;

const getPendingAcceptedOrders = function() {
  return db
    .query(
      `SELECT orders.*, users.name AS user_name, users.phone AS user_phone, items.name AS item_name, order_line_items.quantity AS item_qty
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_line_items ON orders.id = order_line_items.order_id
      JOIN items ON items.id = order_line_items.item_id
      WHERE status = 'pending' OR status = 'accepted' ORDER BY status DESC, date_created ;`
    )
    .then(result => {
      let orders = {};
      for (const order of result.rows) {
        if (!orders[order.id]) {
          orders[order.id] = [order];
        } else {
          orders[order.id].push(order);
        }
      }
      return orders;
    })
    .catch(err => console.log(err.message));
};

exports.getPendingAcceptedOrders = getPendingAcceptedOrders;

const getUserPendingAcceptedOrder = function(userId) {
  return db
    .query(
      `SELECT orders.*, users.name AS user_name, users.phone AS user_phone, items.name AS item_name, order_line_items.quantity AS item_qty
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_line_items ON orders.id = order_line_items.order_id
      JOIN items ON items.id = order_line_items.item_id
      WHERE (status = 'pending' OR status = 'accepted') AND user_id = $1 ORDER BY status DESC, date_created ;`,
      [userId]
    )
    .then(result => {
      let orders = {};
      for (const order of result.rows) {
        if (!orders[order.id]) {
          orders[order.id] = [order];
        } else {
          orders[order.id].push(order);
        }
      }
      return orders;
    })
    .catch(err => console.log(err.message));
};

exports.getUserPendingAcceptedOrder = getUserPendingAcceptedOrder;

const cancelOrder = function(order_no) {
  console.log('this is db order no', order_no);
  return db
    .query(
      `UPDATE orders
    SET status = 'canceled'
    WHERE status = $1
    OR status = $2
    AND order_number = $3;`,
      ["accepted", "pending", order_no]
    )
    .then(() => {
      return true;
    })
    .catch(err => console.log(err.message));
};
exports.cancelOrder = cancelOrder;

const fulfillOrder = function(order_no) {
  return db
    .query(
      `UPDATE orders
      SET status = 'fulfilled',
      date_finished = NOW()
      WHERE status = 'accepted' AND  order_number = $1;`,
      [order_no]
    )
    .then(() => {
      return true;
    })
    .catch(err => console.log(err.message));
};
exports.fulfillOrder = fulfillOrder;

// it seems like this query is not being used
const getActiveOrders = function() {
  return db
    .query(`SELECT * FROM orders WHERE status = 'accepted';`)
    .then(result => {
      return result.rows;
    })
    .catch(err => console.log(err.message));
};
exports.getActiveOrders = getActiveOrders;

const userOrderHistory = function(user_id) {
  return db
    .query(
      `SELECT orders.*, users.name AS user_name, users.phone AS user_phone, items.name AS item_name, order_line_items.quantity AS item_qty
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_line_items ON orders.id = order_line_items.order_id
      JOIN items ON items.id = order_line_items.item_id
      WHERE (status = 'rejected' OR status = 'canceled' OR status = 'fulfilled') AND user_id = $1 ORDER BY status DESC, date_created ;`,
      [user_id]
    )
    .then(result => {
      let orders = {};
      for (const order of result.rows) {
        if (!orders[order.id]) {
          orders[order.id] = [order];
        } else {
          orders[order.id].push(order);
        }
      }
      return orders;
    })
    .catch(err => console.log(err.message));
};

exports.userOrderHistory = userOrderHistory;

const adminOrderHistory = function() {
  return db
    .query(
      `SELECT orders.*, users.name AS user_name, users.phone AS user_phone, items.name AS item_name, order_line_items.quantity AS item_qty
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_line_items ON orders.id = order_line_items.order_id
      JOIN items ON items.id = order_line_items.item_id
      WHERE (status = 'rejected' OR status = 'fulfilled' OR status = 'canceled') ORDER BY date_created ;`
    )
    .then(result => {
      let orders = {};
      for (const order of result.rows) {
        if (!orders[order.id]) {
          orders[order.id] = [order];
        } else {
          orders[order.id].push(order);
        }
      }
      return orders;
    })
    .catch(err => console.log(err.message));
};

exports.adminOrderHistory = adminOrderHistory;

const getPhoneNumber = function(order_no) {
  return db
    .query(
      ` SELECT users.name, users.phone , orders.order_number FROM orders JOIN users ON orders.user_id = users.id WHERE orders.order_number = $1;`,
      [order_no]
    )
    .then(result => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.getPhoneNumber = getPhoneNumber;

const getOrderCount = function() {
  return db
    .query(`SELECT COUNT(*) FROM orders;`)
    .then(result => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.getOrderCount = getOrderCount;

const createOrder = function(user_id, order_count) {
  console.log('userid', user_id);
  const date = new Date();
  let order_no = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  order_no = order_no.replace(/-/g, "");
  order_count++;
  order_no += order_count;
  return db
    .query(
      `INSERT INTO orders(user_id, order_number, date_created)
       VALUES($1, $2, NOW())
       RETURNING *;`,
      [user_id, order_no]
    )
    .then(result => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.createOrder = createOrder;

const addOrderLineItems = function(order_id, itemList) {
  let queryString = `INSERT INTO order_line_items (item_id, order_id, quantity) VALUES`;
  const numberOfItems = Object.keys(itemList).length * 2;
  let queryParams = Object.entries(itemList)
    .flat()
    .map(vals => parseInt(vals));
  for (let i = 1; i <= numberOfItems; i += 2) {
    queryString += ` ($${i}, ${order_id}, $${i + 1}),`;
  }
  queryString = queryString.slice(0, -1);
  queryString += ` RETURNING *;`;
  return db
    .query(queryString, queryParams)
    .then(result => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.addOrderLineItems = addOrderLineItems;

// it seems like this function is not being used
const getOrder = function(order_no) {
  return db
    .query(`SELECT * FROM orders WHERE order_number = $1;`, [order_no])
    .then(result => {
      console.log(result.rows);
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.getOrder = getOrder;

const getUserInfo = function(id) {
  return db
    .query(
      `
      SELECT name ,phone ,email ,password ,is_admin
      FROM users WHERE id = $1`,
      [id]
    )
    .then(result => {
      console.log(result.rows);
      return result.rows;
    })
    .catch(err => console.log(err.message));
};
exports.getUserInfo = getUserInfo;

const updateUserInfo = function(id, name, email, phone) {
  console.log("HERE:", id, name, email, phone);
  return db

    .query(
      `
    UPDATE users
    SET name = $2,
    email = $3,
    phone = $4
    WHERE id = $1;`,
      [id, name, email, phone]
    )
    .then(result => {
      console.log("ROWS:", result.rows);
      return result;
    })
    .catch(err => console.log(err.message));
};
exports.updateUserInfo = updateUserInfo;

const getItemByName = function(name) {
  return db
    .query(`SELECT id, name, price, img_url, tag FROM items WHERE name = $1;`, [
      name
    ])
    .then(result => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.getItemByName = getItemByName;

const isAdmin = function(id) {
  return db
    .query(`SELECT is_admin  FROM users WHERE id = $1;`, [id])
    .then(result => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
};
exports.isAdmin = isAdmin;
