-- Migration: add mode_paiement column to finance_entries
-- Run this once on your MySQL database

ALTER TABLE finance_entries
  ADD COLUMN mode_paiement ENUM('especes','moov_money','tmoney','virement_bancaire')
  DEFAULT 'especes'
  AFTER type;
