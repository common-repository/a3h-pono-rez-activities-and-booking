<?php
/**
 * Admin screens for PonoRez configuration.
 */

final class PonoRezAdminConfig {
    /* Plain old HTML table for listing activities. Intended to be updated via an AJAX call. */
    static public function prActivityList () {
        $psc = PR()->providerService();
        $serviceCreds = PR()->serviceLogin();
        $activities = array();
        $groups = get_option('pr_activity_groups');

        // Look up the info if we have the login.
        if ($serviceCreds['username']) {
            $activityList = new PonoRezActivityList ($psc, $serviceCreds);

            $activities = $activityList->displayItems(array('filter' => @$_GET['pra_filter'],
                                                            'page'   => @$_GET['pra_page'],
                                                            'count'  => @$_GET['pra_count']));
        }

        // List our groups.
        if ($groups): ?>
  <h2>Activity Groups</h2>
  <table class="wp-list-table widefat">
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Activities</th>
        <th>Shortcode</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($groups as $groupName => $activityIds): ?>
      <tr>
        <th class="check-column" scope="row">
          <input type="checkbox" class="pr_group_name" pr-group-name="<?php echo $groupName; ?>" name="pr_group_name_<?php echo $groupName; ?>" />
        </th>
        <td><?php echo $groupName; ?></td>
        <td><?php echo implode(', ', $activityIds); ?></td>
        <td><code>[pr_group&nbsp;name="<?php echo $groupName; ?>"]</code></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <button type="button" id="pr_delete_groups" class="button">Delete Groups</button>
  <br>
  <?php endif; ?>
  <h2 style="float:left;width:40%">Available Activities</h2>
  <div style="float:right;width:40%;">
    <a href="#" id="pra_prev_page" data-page="<?php echo $activityList->prevPage() ?>" data-count="<?php echo $activityList->resultsPerPage ?>">&lt; Prev</a>
    |&nbsp;Page <?php echo $activityList->currentPage ?> of <?php echo $activityList->maxPage ?>&nbsp|
    <a href="#" id="pra_next_page" data-page="<?php echo $activityList->nextPage() ?>" data-count="<?php echo $activityList->resultsPerPage ?>">Next &gt;</a>
    <input style="width:50%" type="text" id="pra_activity_filter" placeholder="Filter list" value="<?php echo @$_GET['pra_filter']?>" />
    <button id="pra_filter_go">Go</button>
  </div>
  <?php if (0 < count($activities)): ?>
  <table class="wp-list-table widefat">
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Island</th>
        <th>Description</th>
        <th>Notes</th>
        <th>Times</th>
        <th>Group</th>
        <th>Order</th>
        <th>Shortcode</th>
      </tr>
    </thead>
    <tbody id="the-list">
      <?php foreach ($activities as $act):
       $groupName = pr_key_in_array($act->id, $groups); ?>
      <tr>
        <th class="check-column" scope="row">
          <input type="checkbox" class="pr_activity_id" pr-activity-id="<?php echo $act->id; ?>" name="pr_activity_id_<?php echo $act->id; ?>" />
        </th>
        <td><strong><?php echo $act->name; ?></strong></td>
        <td><?php echo $act->island; ?></td>
        <td><?php echo $act->description; ?></td>
        <td><?php echo $act->notes; ?></td>
        <td><?php echo $act->times; ?></td>
        <td><?php if ($groupName) echo $groupName; ?></td>
        <td><input type="text" size="3"></td>
        <td><code>[pr_activity&nbsp;id=<?php echo $act->id; ?>]</code></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <input type="text" id="pr_group_name" name="pr_group_name" placeholder="New group name">
  <button type="button" id="pr_add_group" class="button button-primary">Add Group</button>
  <button type="button" id="pr_refresh" class="button">Refresh List</button>
  <?php else: ?>
  <br>
<p><em>No activities found.</em></p>
  <?php endif; 

        wp_die();                                            
    }

    /* Get a list of available templates. */
    static public function getTemplateList () {
        $templateDir = realpath(dirname(__FILE__) . '/../') . '/templates/';

        $fileList = glob($templateDir . '/*.html');
        $output = array();

        foreach ($fileList as $f) {
            $output[] = pathinfo($f, PATHINFO_FILENAME);
        }

        return $output;
        
    }
    
    /* Build the default admin page. */
    static public function adminConfigPage () {
        $psc = PR()->providerService();
        $serviceCreds = PR()->serviceLogin();

        // Set up our various calendar styles
        $selectedStyle = get_option('pr_default_style');
        $styles = array('black-tie', 'blitzer', 'cupertino', 'dark-hive', 'dot-luv', 'eggplant', 'excite-bike',
                        'flick', 'hot-sneaks', 'humanity', 'le-frog', 'mint-choc', 'overcast', 'pepper-grinder',
                        'redmond', 'smoothness', 'south-street', 'start', 'sunny', 'swanky-purse',
                        'trontastic', 'ui-darkness', 'ui-lightness', 'vadar');

        // Get our default template
        $defaultTemplate = get_option('pr_default_template');
        $timeout = get_option('pr_cache_timeout');
        
   ?>
<div class="wrap"><div id="icon-tools" class="icon32"></div>
  <h2>PonoRez Account Configuration</h2>
  <form method="POST" action="options.php">
    <?php 
       settings_fields('pr-settings');
       do_settings_sections('pr-settings'); 
       ?>
    <label for="pr_username"><b>Username:</b></label>
    <input id="pr_username" type="text" name="pr_username" value="<?php echo esc_attr(get_option('pr_username')); ?>" />
    <label for="pr_password"><b>Password:</b></label>
    <input id="pr_password" type="password" name="pr_password" value="<?php echo esc_attr(get_option('pr_password')); ?>" />
    <br />
    <label for="pr_cache_timeout"><b>Cache Timeout:</b></label>
    <select id="pr_cache_timeout" name="pr_cache_timeout">
      <option value="0"<?php echo (0 == $timeout) ? ' SELECTED' : '' ?>>Disabled</option>
      <option value="3600"<?php echo (3600 == $timeout) ? ' SELECTED' : '' ?>>1 Hour</option>
      <option value="21600"<?php echo (21600 == $timeout) ? ' SELECTED' : '' ?>>6 Hours</option>
      <option value="86400"<?php echo (86400 == $timeout) ? ' SELECTED' : '' ?>>1 Day</option>
    </select>
    <em>This value determines how often information is retrieved from the Pono Rez servers.</em>
    <br />
    <label for="pr_default_style"><b>Default Style:</b></label>
    <select id="pr_default_style" name="pr_default_style">
      <?php foreach ($styles as $style): ?>
      <?php printf('<option value="%s"%s>%s</option>',
                                       $style,
                                       ($selectedStyle === $style) ? ' SELECTED' : '',
                                       $style);
            ?>
      <?php endforeach; ?>
    </select>
    <br />
    <label for="pr_default_template"><b>Default Template:</b></label>
    <select id="pr_default_template" name="pr_default_template">
      <?php foreach (self::getTemplateList() as $template): ?>
      <?php printf('<option value="%s"%s>%s</option>',
            $template,
            ($defaultTemplate === $template) ? ' SELECTED' : '',
            $template); ?>
      <?php endforeach; ?>
    </select>
    <em>This option is only used for single activity pages, NOT for activity groups.</em>
    <br />
    <?php submit_button(); ?>
  </form>
  <div id="prUsageInstructions">
    <h2>Using this Plugin</h2>
    <p>
      Loading and displaying a single activity is simple. Use the <code>pr_activity</code> shortcode as displayed in
      the <strong>Available Activities</strong> below. A group of activities takes a little more work. For a sample
      template of how an activity group can be used, check
      out <a href="https://github.com/pymander/a3h-ponorez-wordpress-plugin/wiki/ActivityGroupExample">the Activity Group
        Example in our wiki</a>.
    </p>
  </div>
  <div id="prActivityTable">
    <p>Enter login information above to see your activity list.</p>
  </div>
</div>
<?php
    }

    public function registerSettings () {
        register_setting('pr-settings', 'pr_username');
        register_setting('pr-settings', 'pr_password');
        register_setting('pr-settings', 'pr_default_style');
        register_setting('pr-settings', 'pr_default_template');
        register_setting('pr-settings', 'pr_cache_timeout');
        register_setting('pr-settings-groups', 'pr_activity_groups');
    }

    public function addSettingsMenu () {
        add_menu_page( 
            'A3H Pono Rez for WordPress',
            'A3H Pono Rez for WordPress',
            'manage_options', 
            'a3h_ponorez', 
            array('PonoRezAdminConfig', 'adminConfigPage')
        );
    }

    /**
     * Test the login information and store it. Return good information.
     */
    public function ajaxStoreLogin () {
        // Submitted parameters
        $username = $_POST['pr_username'];
        $password = $_POST['pr_password'];

        $psc = PR()->providerService();
        $testResult = $psc->testLogin(array('serviceLogin' => array('username' => $username,
                                                                    'password' => $password)));

        // Return values kept here.
        $ajaxResult = array();
        
        if (true == $testResult->return) {
            update_option('pr_username', $username);
            update_option('pr_password', $password);

            $ajaxResult['success'] = true;
        }
        else {
            $ajaxResult['success'] = false;
            $ajaxResult['message'] = $testResult->out_status;
        }

        header( "Content-Type: application/json" );
        
        echo json_encode($ajaxResult);

        wp_die();
    }

    /**
     * Delete groups.
     */
    public function ajaxDeleteGroups () {
        $groups = get_option('pr_activity_groups');

        if (!$groups) {
            $groups == array();
        }

        $groupsToDelete = $_GET['groups'];
        $deleteCount = 0;

        foreach ($groupsToDelete as $gn) {
            if ($groups[$gn]) {
                unset($groups[$gn]);
                $deleteCount++;
            }
        }

        // If we've deleted things, save our modified array.
        if (0 < $deleteCount) {
            update_option('pr_activity_groups', $groups);
        }
        
        $ajaxResult = array(
            'success' => true,
            'deleteCount' => $deleteCount
        );
        header( "Content-Type: application/json" );
        
        echo json_encode($ajaxResult);

        wp_die();
    }
    
    /**
     * Store group information submitted by form.
     */
    public function ajaxStoreGroup () {
        $groups = get_option('pr_activity_groups');

        if (!$groups) {
            $groups == array();
        }

        $groupName = $_GET['groupname'];
        $activityIds = $_GET['idlist'];

        // Sanitize the group name. All lower case, numbers and letters only. Must start with a letter.
        $groupName = preg_replace('/\W+/', '', strtolower($groupName));
        if ('' === $groupName) {
            $groupName = 'g' . date('Ymd');
        }

        // If there is no groupName or groupIds, we fail now.
        if (!$groupName || 0 >= count($activityIds)) {
            $ajaxResult = array(
                'success' => false,
                'message' => sprintf('Cannot add %d activities to group "%s".',
                                     count($activityIds),
                                     $groupName)
            );
        } else {
            // Store our new group.
            $groups[$groupName] = $activityIds;
        
            update_option('pr_activity_groups', $groups);

            $ajaxResult = array(
                'success' => true,
                'groupName' => $groupName,
                'activityIds' => $activityIds
            );
        }
        
        header( "Content-Type: application/json" );
        
        echo json_encode($ajaxResult);

        wp_die();

    }

    public function init () {
        if (!is_admin()) {
            return;
        }
        
        // Setup AJAX calls
        add_action('wp_ajax_pr_store_login', array($this, 'ajaxStoreLogin'));
        add_action('wp_ajax_pr_activity_list', array($this, 'prActivityList'));
        add_action('wp_ajax_pr_store_group', array($this, 'ajaxStoreGroup'));
        add_action('wp_ajax_pr_delete_groups', array($this, 'ajaxDeleteGroups'));

        if (defined('DOING_AJAX') && DOING_AJAX) {
            return;
        }

        // Non-Ajax admin stuff.
        //wp_enqueue_script('pr_admin', plugins_url('assets/pr_admin.min.js', dirname(__FILE__)), array('jquery'));
        wp_enqueue_script('pr_admin', plugins_url('assets/original/pr_admin.js', dirname(__FILE__)), array('jquery'));
        add_action('admin_menu', array($this, 'addSettingsMenu'));
        add_action('admin_init', array($this, 'registerSettings'));
    }
}


        
   
