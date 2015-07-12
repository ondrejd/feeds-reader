-- The first `Feeds Reader` database schema.

PRAGMA "foreign_keys" = ON;

CREATE TABLE Category (
	Id INTEGER PRIMARY KEY ASC,
	Title TEXT UNIQUE NOT NULL
);

INSERT INTO Category VALUES (1, "Default category");

CREATE TABLE Feed (
	Id INTEGER PRIMARY KEY ASC,
	CategoryId INTEGER NOT NULL,
	Title TEXT NOT NULL,
	Type TEXT,
	HtmlUrl TEXT,
	XmlUrl TEXT,
	FOREIGN KEY (CategoryId) REFERENCES Category
);

PRAGMA "user_version" = 1;
