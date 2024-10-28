=== A3H Pono Rez Reservation Interface for WordPress ===
Contributors: arnesonium
Tags: a3h, vacation, pono rez, rentals, reservations, booking calendar, booking, booking plugin, reservation calendar, booking system
Requires at least: 4.0
Tested up to: 4.5.3
Stable tag: v2.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add A3H Pono Rez interfaces, reservations, and tours to your WordPress site.

== Description ==

[Pono Rez](http://ponorez.com/) is a web based Central Reservation System (CRS) targeting
Tours & Attractions. The system comes equipped with a slick Ecommerce
solution, customization tools and API messaging. In addition to the
scheduling of Tours, Retail Store, Gift Certificates & Transportation
are standard modules. The system complies with Payment Card Industry
data security standards & credit card standards.

This plugin allows Pono Rez users to integrate information about
activities into their WordPress websites using templates and
shortcodes. It requires an active Pono Rez account to use properly.

Documentation for this plugin can be found in the [GitHub wiki page](https://github.com/pymander/a3h-ponorez-wordpress-plugin/wiki).

The Pono Rez system provides a SOAP interface, which is hosted on
<https://www.hawaiifun.org/>. The interface is documented on the Pono
Rez website at
<http://www.ponorez.com/Agency%20Service%20Specifications.pdf>. 

== Installation ==

To install this plugin, follow these directions:

1. Download the latest zip file.
1. Next, load up your WordPress blog’s dashboard, and go to **Plugins > Add New**.
1. Upload the zip file.
1. Click **Activate**.
1. Go to the **A3H Pono Rez for WordPress** admin panel.
1. Enter your Pono Rez username and password.
1. Click **Save Changes**.

== Frequently Asked Questions ==

== Screenshots ==

== Changelog ==
= 2.0 =
* Support for activity groups (major change!)
* Revamping/overhauling JavaScript
* Minified PonoRez JavaScript
* Many major enhancements on the admin panel
* Smarter error handling for many shortcodes
* Option to disable results cache (good for development)
* Single activity transportation routes

= 1.1 =
* Provide more information about SOAP service hosting.
* Include all JavaScript, CSS, and image files in the plugin.
* Use WordPress transients to cache activity templates.

= 1.0 =
* First public release.

= 0.1 =
* Development pre-release.

== Upgrade Notice ==

== Usage ==

Documentation for this plugin can be found in the [GitHub wiki page](https://github.com/pymander/a3h-ponorez-wordpress-plugin/wiki).

Templates only work for single-activity pages, which aren't used that
often. You are probably looking for how to use activity groups. Check
the [example page in the wiki](https://github.com/pymander/a3h-ponorez-wordpress-plugin/wiki/ActivityGroupExample) 
for good details on how to do that.

Templates should be added to the `templates` subdirectory in this
plugin. They can contain shortcodes.

These two shortcodes load a single activity from the Pono Rez database.

* **\[pr_activity id=XXX\]** - Load activity id XXX and use it to fill out the default template.
* **\[pr_load_activity id=XXX\]** - Used to load activity XXX without filling out and using a template.

These shortcodes are used to request specific attributes for the
currently loaded activity.

* **\[pr_activity_name\]**
* **\[pr_activity_description\]**
* **\[pr_datepicker\]**
* **\[pr_guest_type_list\]**
* **\[pr_guest_type\]**
* **\[pr_hotel_select\]**
* **\[pr_hotel_room\]**
* **\[pr_check_availability\]** - Print out the "Check Availability" button.



