<?php
/**
 * Copy this file to config.php and fill in your Dreamhost MySQL credentials.
 */

declare(strict_types=1);

// DreamHost: use the hostname from panel → MySQL Databases → HOSTNAME (NOT localhost)
const DB_HOST = 'mysql.jeffginger.com';
const DB_PORT = 3306;
const DB_NAME = 'yourusername_taskapp';
const DB_USER = 'yourusername_taskapp';
const DB_PASS = 'your-database-password';

// Optional shared secret sent as X-API-Key from the frontend.
const API_KEY = '';

// Set to your site origin, e.g. https://jeffginger.com
const ALLOWED_ORIGIN = '*';
