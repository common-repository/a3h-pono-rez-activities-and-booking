<?php
/**
 * @package A3H
 */
/*
Plugin Name: A3H Pono Rez Reservation Interface for WordPress
Description: Add A3H Pono Rez interfaces, reservations, and tours to your WordPress site. 
Version: 2.0.0
Author: Erik L. Arneson
Author URI: http://www.arnesonium.com/
License: GPLv2 or later

    Copyright 2015-16 Activities & Attractions Association of Hawaii, Inc.

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

defined('ABSPATH') or die("No script kiddies please!");

/**
 * For full WSDL/SOAP service documentation, see http://www.ponorez.com/Agency%20Service%20Specifications.pdf
 */

define('PR_PUBLIC_SERVICE_WSDL', 'https://www.hawaiifun.org/reservation/services/2012-05-10/PublicService?wsdl');
define('PR_PROVIDER_SERVICE_WSDL', 'https://www.hawaiifun.org/reservation/services/2012-05-10/SupplierService?wsdl');
define('PR_WHOLESALER_SERVICE_WSDL', 'https://www.hawaiifun.org/reservation/services/2012-05-10/AgencyService?wsdl');

/**
 * Main Pono Rez interface class
 *
 * @class PonoRez
 */
final class PonoRez {
    /**
     * @var PonoRez The single instance of the class
     * @since 2.1
     */
    protected static $_instance = null;

    /**
     * @var SoapClient An instance of the Public Service WSDL
     */
    protected $_publicService = null;

    /**
     * @var SoapClient An instance of the Agency Provider Service WSDL
     */
    protected $_providerService = null;

    /**
     * @var SoapClient An instance of the Activity Wholesaler Service WSDL
     */
    protected $_wholesalerService = null;
    
    /**
     * @return SoapClient A public service soap client
     * @TODO Check for exceptions.
     */
    public function publicService () {
        if (is_null($this->_publicService)) {
            $this->_publicService = new SoapClient(PR_PUBLIC_SERVICE_WSDL);
        }
        return $this->_publicService;
    }

    /**
     * @return SoapClient An agency provider service soap client
     * @TODO Check for exceptions.
     */
    public function providerService () {
        if (is_null($this->_providerService)) {
            $this->_providerService = new SoapClient(PR_PROVIDER_SERVICE_WSDL);
        }
        return $this->_providerService;
    }

    /**
     * @return SoapClient An activity wholesaler service soap client
     * @TODO Check for exceptions.
     */
    public function wholesalerService () {
        if (is_null($this->_wholesalerService)) {
            $this->_wholesalerService = new SoapClient(PR_WHOLESALER_SERVICE_WSDL);
        }
        return $this->_wholesalerService;
    }

    /**
     * @return SoapVar A ServiceLogin object
     */
    public function serviceLogin () {
        return array("username" => get_option('pr_username'),
                     "password" => get_option('pr_password'));
    }

    /**
     * @return PonoRez - Singleton instance
     * @see PR()
     */
    public static function instance () {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    protected function _transientTag($scName, $id) {
        $nonAlnum = array('.', '/', '-', '_', ' ');
        
        return join('_', array('pr',
                               str_replace($nonAlnum, '', $scName),
                               str_replace($nonAlnum, '', $id)));
    }
    
    /**
     * Cache the output of a function as a transient.
     *
     * @param string $scName The name of the shortcode calling the function.
     * @param string $tag A variable tag used to store the transient.
     * @param function $f The anonymous function whose output will be cached.
     */
    public function withTransient ($scName, $tag, $f) {
        $transientTag = $this->_transientTag($scName, $tag);
        $timeout = get_option('pr_cache_timeout');
        $rval = false;

        if (!$timeout && 0 != $timeout) {
            $timeout = 3600;
            set_option('pr_cache_timeout', $timeout);
        }

        // When $timeout is 0, the cache is disabled.
        if (0 > $timeout) {
            $rval = get_transient($transientTag);
        }
            
        if (false === $rval) {
            // Catch exceptions here.
            // @TODO Better error reporting.
            try {
                $rval = $f();
            }
            catch (SoapFault $e) {
                printf("<br>\n<pre>\n%s\n</pre>", $e->getMessage());
            }

            if (0 != $timeout) {
                set_transient($transientTag, $rval, $timeout);
            }
        }

        return $rval;
    }

}

/**
 * Returns the main instance of the PonoRez object.
 *
 * @return PonoRez
 */
function PR() {
        return PonoRez::instance();
}

/**
 * Look at an array of arrays for a value.
 */
function pr_key_in_array($value, $array) {
    if (!$array) return false;
    
    foreach ($array as $k => $v) {
        if (in_array($value, $v)) {
            return $k;
        }
    }
    return false;
}

/**
 * Bootstrap function for admin pages.
 */
function pr_bootstrap_admin () {
    require_once('lib/class-ponorezadminconfig.php');
    require_once('lib/class-ponorezactivitylist.php');

    $prc = new PonoRezAdminConfig ();
    $prc->init();
}
add_action('init', 'pr_bootstrap_admin');

/**
 * Bootstrap function for public pages.
 */
function pr_bootstrap_public () {
    // require_once('lib/class-ponorezrest.php');
    require_once('lib/class-ponoreztransportation.php');
    require_once('lib/class-ponorezgroup.php');
    require_once('lib/class-ponoreztemplate.php');

    $prt = new PonoRezTemplate ();
    $prt->init();
}
add_action('init', 'pr_bootstrap_public');

/**
 * Shortcode to test login information.
 */
function pr_test_login_sc ($atts = array(), $content = null, $tag)
{
    $pr = PR();
    $psc = $pr->providerService();

    $sl = $pr->serviceLogin();
    $result = $psc->testLogin(array('serviceLogin' => $pr->serviceLogin()));
    
    if (true == $result->return) {
        $rval = "<strong>Login succeeded.</strong>\n";
    }
    else {
        $rval= "<strong>Login failed.</strong>\n";

        $rval .= sprintf("<pre>\n%s</pre>\n",
                         $result->out_status);
    }

    return $rval;
}
add_shortcode('pr_test_login', 'pr_test_login_sc');

// End a3h.php
