-- Migration: rename plan values  free→basic, basic→pro, pro→business
-- Run ONCE on the Hetzner MySQL database (togolese, port 3307)
-- Apply in this exact order.

-- 1. Expand ENUMs to allow all values during transition
ALTER TABLE shops MODIFY plan ENUM('free','basic','pro','business') NOT NULL DEFAULT 'basic';
ALTER TABLE shop_payments MODIFY plan ENUM('basic','pro','business') NOT NULL;

-- 2. Rename data (order matters: pro→business first to avoid collisions)
UPDATE shops SET plan = 'business' WHERE plan = 'pro';
UPDATE shops SET plan = 'pro'      WHERE plan = 'basic';
UPDATE shops SET plan = 'basic'    WHERE plan = 'free';

UPDATE shop_payments SET plan = 'business' WHERE plan = 'pro';
UPDATE shop_payments SET plan = 'pro'      WHERE plan = 'basic';

-- 3. Lock ENUMs to new values only
ALTER TABLE shops MODIFY plan ENUM('basic','pro','business') NOT NULL DEFAULT 'basic';
ALTER TABLE shop_payments MODIFY plan ENUM('pro','business') NOT NULL;

-- Verify
SELECT plan, COUNT(*) AS n FROM shops GROUP BY plan;
SELECT plan, COUNT(*) AS n FROM shop_payments GROUP BY plan;
