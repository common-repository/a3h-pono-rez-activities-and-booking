<?php
/**
 * Database administration for PonoRez plugin
 */

// Access the WordPress db handle.
global $wpdb;

define('PR_CATEGORY_INFO', $wpdb->prefix . 'pr_category_info');
define('PR_CATEGORY_ISLAND_INFO', $wpdb->prefix . 'pr_category_island_info');

final class PonoRezDb {
    
}
