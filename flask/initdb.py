import sqlite3

connection = sqlite3.connect('database.db')

print("initializing db...")
with open('schema.sql') as f:
    connection.executescript(f.read())

connection.commit()
connection.close()
print("finished!")