const sqlite3 = require("sqlite3").verbose();
const queueStream = require("./queue.js");
const queue = new queueStream();

module.exports = {
  fetch: function(ID) {
    return new Promise((resolve, error) => {
      var db;

      function createDb() {
        db = new sqlite3.Database("economy.sqlite", createTable);
      }

      function createTable() {
        db.run(
          "CREATE TABLE IF NOT EXISTS Economies (userId TEXT, balance INTEGER, cooldowns TEXT, inventory TEXT)",
          checkIfCreated
        );
      }

      function checkIfCreated() {
        db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
          err,
          row
        ) {
          if (!row) return insertRows();
          return resolve(row);
        });
      }

      function insertRows() {
        var insert = db.prepare(
          "INSERT INTO Economies (userId, balance, cooldowns, inventory) VALUES (?,?,?,?)"
        );
        insert.run(ID, 0, 0, "", "");
        insert.finalize(readAllRows);
      }

      function readAllRows() {
        db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
          err,
          row
        ) {
          return resolve(row);
          closeDb();
        });
      }

      function closeDb() {
        db.close();
      }

      createDb();
    });
  },

  update: function(ID, column, input) {
    return queue.addToQueue({
      value: this._update.bind(this),
      args: [ID, column, input]
    });
  },

  _update: function(ID, column, input) {
    return new Promise((resolve, error) => {
      var db;

      function createDb() {
        db = new sqlite3.Database("economy.sqlite", createTable);
      }

      function createTable() {
        db.run(
          "CREATE TABLE IF NOT EXISTS Economies (userId TEXT, balance INTEGER, cooldowns TEXT, inventory TEXT)",
          checkIfCreated
        );
      }

      function checkIfCreated() {
        db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
          err,
          row
        ) {
          if (!row) return insertRows();

          db.run(
            `UPDATE Economies SET ${column} = '${input}' WHERE userId = '${ID}'`
          );
          db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
            err,
            row
          ) {
            return resolve(row);
          });
        });
      }

      function insertRows() {
        var insert = db.prepare(
          "INSERT INTO Economies (userId, balance, cooldowns, inventory) VALUES (?,?,?,?)"
        );
        insert.run(ID, 0, 0, "", "");
        insert.finalize(readAllRows);
      }

      function readAllRows() {
        db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
          err,
          row
        ) {
          closeDb();
        });
      }

      function closeDb() {
        checkIfCreated();
        db.close();
      }

      createDb();
    });
  },

  destroy: function(ID) {
    return queue.addToQueue({
      value: this._destroy.bind(this),
      args: [ID]
    });
  },

  _destroy: function(ID) {
    return new Promise((resolve, error) => {
      var db;

      function createDb() {
        db = new sqlite3.Database("economy.sqlite", createTable);
      }

      function createTable() {
        db.run(
          "CREATE TABLE IF NOT EXISTS Economies (userId TEXT, balance INTEGER, cooldowns TEXT, inventory TEXT)",
          checkIfCreated
        );
      }

      function checkIfCreated() {
        db.get(`SELECT * FROM Economies WHERE userId = '${ID}'`, function(
          err,
          row
        ) {
          if (!row) return resolve("Done");

          db.run(`DELETE FROM Economies WHERE userId = '${ID}'`, function(
            err,
            row
          ) {
            if (err) return error("Something went wrong.");
            return resolve("Done");
          });
        });
      }

      createDb();
    });
  },

  fetchAll: function(filter) {
    return queue.addToQueue({
      value: this._fetchAll.bind(this),
      args: [filter]
    });
  },

  _fetchAll: function(filter = {}) {
    return new Promise((resolve, error) => {
      var db;

      function createDb() {
        db = new sqlite3.Database("economy.sqlite", createTable);
      }

      function createTable() {
        db.run(
          "CREATE TABLE IF NOT EXISTS Economies (userId TEXT, balance INTEGER, cooldowns TEXT, inventory TEXT)",
          readAllRows
        );
      }

      function readAllRows() {
        if (filter.search) {
          db.all(
            `SELECT count(*) + 1 AS rank FROM (SELECT * FROM Economies WHERE balance != 0 ORDER BY balance DESC) WHERE userId == ${filter.search}`,
            function(err, rows) {
              return resolve(rows[0]);
              closeDb();
            }
          );
        } else {
          db.all(
            `SELECT * FROM Economies WHERE balance != 0 ORDER BY balance DESC LIMIT ${filter.limit}`,
            function(err, rows) {
              closeDb();
              return resolve(rows);
            }
          );
        }
      }

      function closeDb() {
        db.close();
      }

      createDb();
    });
  }
};
