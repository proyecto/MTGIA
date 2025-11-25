-- Migration script to add language column to existing databases
-- Run this if you have an existing database

ALTER TABLE cards ADD COLUMN language TEXT DEFAULT 'English';
