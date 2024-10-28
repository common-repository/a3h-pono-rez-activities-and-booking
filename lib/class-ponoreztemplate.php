<?php
/**
 * Shortcodes for PonoRez templates
 */

final class PonoRezTemplate {
    public $defaultTemplate;

    protected $_currentActivity = null;
    protected $_currentActivityGroup = null;

    protected $_soapDebug = null;

    // Used only for cancellation policy checkboxes.
    protected $_cancellationPolicyCount = 0;

    public function setCurrentActivity ($activityId) {
        $psc = PR()->providerService();
        $serviceCreds = PR()->serviceLogin();

        $result = $psc->getActivity(array('serviceLogin' => $serviceCreds,
                                          'activityId' => $activityId));

        $this->_soapDebug = print_r($result, true);
        
        $this->_currentActivity = $result->return;
    }

    public function setCurrentActivityGroup ($groupName) {
        $groups = get_option('pr_activity_groups');
        $psc = PR()->providerService();
        $serviceCreds = PR()->serviceLogin();

        if (!$groups[$groupName]) {
            return null;
        }
        
        $activityIds = $groups[$groupName];
        $activities = array();

        // Create our activity objects.
        foreach ($activityIds as $id) {
            $result = $psc->getActivity(array('serviceLogin' => $serviceCreds,
                                              'activityId' => $id));

            $activities[] = $result->return;
        }

        $this->_currentActivityGroup = new PonoRezGroup($groupName, $activities);

        // We also set our current activity to the first one in the group.
        $this->_currentActivity = $activities[0];
    }

    public function prLoadActivityShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null
        ), $atts);
        $rval = '';

        try {
            if (0 < (int)$a['id']) {
                $this->setCurrentActivity((int)$a['id']);
            }
        }
        catch (SoapFault $e) {
            $rval .= sprintf("<br>\n<pre>\n%s\n</pre>",
                             $this->_soapDebug);

        }

        return $rval;
    }
    
    public function prActivityShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null,
            'template' => $this->defaultTemplate
        ), $atts);

        $rval = '';
        
        try {
            if (0 < (int)$a['id']) {
                $this->setCurrentActivity((int)$a['id']);
            }
        }
        catch (SoapFault $e) {
            $rval .= sprintf("<br>\n<pre>\n%s\n</pre>",
                             $this->_soapDebug);

        }

        return $rval . PR()->withTransient('pr_activity', $a['id'] . basename($this->defaultTemplate), function () use ($a) {
            $template_string = file_get_contents($a['template']);
        
            return do_shortcode($template_string);
        });
    }
    
    public function prActivityNameShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null
        ), $atts);

        if (isset($this->_currentActivity))
            return $this->_currentActivity->name;

        return '';
    }

    public function prActivityDescriptionShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null
        ), $atts);

        if (!$this->_currentActivity)
            return 'No activity selected';

        return $this->_currentActivity->description;
    }
    
    public function prDatepickerShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null,
            'group' => 'on',
            'icon' => 'on'
        ), $atts);

        // Just trying to be smart.
        if (!$this->_currentActivity && !$this->_currentActivityGroup)
            return 'No activity selected';
        
        // If there's no group, or group is turned off, use the single activity style.
        // <input id="date_a8455" onclick="calendar(8455, 'date_a8455', false);" readOnly size="15" />
        if ('off' === $a['group'] || null === $this->_currentActivityGroup) {
            $rval_template = <<<EOT
<input id="date_aXXXX" onclick="calendar(XXXX, 'date_aXXXX', false);" readOnly size="15"> <a onMouseOver="window.status='Date Picker';return true;" onMouseOut="window.status='';return true;" href="javascript:calendar(XXXX, 'date_aXXXX', false);">
EOT;

            $rval = str_replace('XXXX', $this->_currentActivity->id, $rval_template);
            $rval = str_replace('PPPP', plugins_url('assets/images', dirname(__FILE__)), $rval);
        }
        else {
            // Activity Group code.
            $rval_template = <<<EOT
<input id="XXXX" onclick="showCalendar(GGGG);" onchange="showPriceAndAvailability(GGGG);" readOnly size="18">
<a onMouseOver="window.status='Date Picker';return true;" onMouseOut="window.status='';return true;" href="javascript:showCalendar(GGGG);" style="vertical-align: middle;">
EOT;
            $rval = str_replace('XXXX', $this->_currentActivityGroup->dateControlId(), $rval_template);
            $rval = str_replace('GGGG', 'g_' . $this->_currentActivityGroup->groupName, $rval);
        }

        // Only include the calendar icon if it's asked for.
        if ('on' === $a['icon']) {
            $rval .= sprintf('<img class="activityDatePicker" height="22" src="%s/show-calendar.gif" width="24" border="0">',
                             plugins_url('assets/images', dirname(__FILE__)));
        }

        // Close with a closing A tag, because of the optional calendar.
        return $rval . '</a>';
    }

    /**
     * Manually specify the guest ID and other info.
     *
     * This shortcode automatically prints out an interface for each
     * guest type. It tries to get smart about guest type maximums to
     * get around limitations in the SOAP interface. */
    public function prGuestShortcode ($atts = array()) {
        $a = shortcode_atts(array(
            'id' => 0,
            'name' => '',
            'min' => 0,
            'max' => 20
        ), $atts);
        $html = '';

        // Build our HTML id tag. This differs if we are in a group setting.
        $htmlIdTagPart = sprintf('a%d', $this->_currentActivity->id);
        if (null != $this->_currentActivityGroup) {
            $htmlIdTagPart = $this->_currentActivityGroup->groupName;
        }
        
        // This shortcode doesn't use SOAP. That makes it fast but
        // also potentially a flaming disaster.
        $html .= sprintf('%s <select class="pr_guest_count guestCount%d" guest-type-id="%d" id="guests_%s_t%d">',
                         $a['name'],
                         $this->_currentActivity->id,
                         $a['id'],
                         $htmlIdTagPart,
                         $a['id']);
        
        for ($i = $a['min']; $i <= $a['max']; $i++) {
            $html .= sprintf('<option value="%d">%d</option>', $i, $i);
        }

        // Not sure that BR belongs there.
        $html .= "</select>\n<br>\n";

        return $html;
    }
    
    public function prGuestTypeListShortcode($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null,
            'min' => 0,
            'max' => 20
        ), $atts);

        if (!$this->_currentActivity)
            return 'No activity selected.';
        
        try {
            $psc = PR()->providerService();
            $serviceCreds = PR()->serviceLogin();

            $result = $psc->getActivityGuestTypes(array('serviceLogin' => $serviceCreds,
                                                        'activityId' => $this->_currentActivity->id,
                                                        'supplierId' => $this->_currentActivity->supplierId,
                                                        'date' => new SoapVar(date('Y-m-d'), XSD_DATE)));
        }
        catch (SoapFault $e) {
            $rval = sprintf("<h3>[SOAP FAULT] Could not load guest types</h3>\n<pre>\n%s\n---\n%s\n</pre>\n",
                            $e->faultcode,
                            $e->faultstring);

            return $rval;
        }

        // Build our HTML id tag. This differs if we are in a group setting.
        $htmlIdTagPart = sprintf('a%d', $this->_currentActivity->id);
        if (null != $this->_currentActivityGroup) {
            $htmlIdTagPart = $this->_currentActivityGroup->groupName;
        }
        
        $rval = '';

        // Workaround a bug in the A3H SOAP interface. If there's only
        // one guest type, it returns a single object instead of an
        // array of guest types. Gotta love inconsistent interfaces,
        // don't you?
        $guestTypeList = $result->return;
        if (!is_array($result->return)) {
            $guestTypeList = array($result->return);
        }
        
        foreach ($guestTypeList as $guestType) {
            // Because the A3H SOAP interface can't be trusted sometimes.
            if (!$guestType)
                continue;
            
            // If no guest types are available, then default to the 'max' setting.
            $max = (0 >= $guestType->availabilityPerGuest) ? $a['max'] : $guestType->availabilityPerGuest;
            $html = '';

            // Debug
            //$html .= sprintf("<!-- aPG: %d  max: %d -->\n", $guestType->availabilityPerGuest, $max);
            
            $html .= sprintf('%s <select class="pr_guest_count guestCount%d" guest-type-id="%d" id="guests_%s_t%d">',
                            $guestType->name,
                            $this->_currentActivity->id,
                            $guestType->id,
                            $htmlIdTagPart,
                            $guestType->id);

            for ($i = 0; $i <= $max; $i++) {
                $html .= sprintf('<option value="%d">%d</option>', $i, $i);
            }
            
            $html .= "</select>";
            $rval .= "\n$html\n";
        }

        $this->_soapDebug = print_r($result, true);

        return $rval;
    }

    /* This shortcode automatically prints out an interface for each
     * guest type. It tries to get smart about guest type maximums to
     * get around limitations in the SOAP interface. */
    public function prGuestTypeShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null,
            'guest-type-id' => null,
            'max' => 20
        ), $atts);

        $rval = '';

        $rval .= sprintf('<select class="guestCount%d" guest-type-id="%d" id="guests_a%d_t%d">',
                        $this->_currentActivity->id,
                        $a['guest-type-id'],
                        $this->_currentActivity->id,
                        $a['guest-type-id']);

        for ($i = 0; $i <= $a['max']; $i++) {
            $rval .= sprintf("<option value='%d'>%d</option>", $i, $i);
        }

        $rval .= "</select>\n";

        return $rval;
    }
    
    public function prHotelSelectShortcode ($atts = array(), $content = null, $tag) {
        $defaultTemplate = <<<EOT
<select class="pr_hotel_select" id="hotel_aAAAA" onchange="console.log('ELA was here');accommodation_setupTransportationRoutes({ supplierId: SSSS, activityId: AAAA, agencyId: 0, hotelId: this.value, routeSelectionContextData: routeSelection_aAAAA_contextData })"></select>
<script type="text/javascript">accommodation_loadHotels({ supplierId: SSSS, activityId:  AAAA, agencyId: 0, hotelSelectSelector: "#hotel_aAAAA" });</script>
EOT;
        
        $a = shortcode_atts(array(
            'id' => null,
            'template' => $defaultTemplate,
            'group' => false
        ), $atts);

        $rval_template = $a['template'];

        $rval = str_replace(array('AAAA', 'SSSS'),
                            array($this->_currentActivity->id,
                                  $this->_currentActivity->supplierId),
                            $rval_template);

        if (true == $a['group']) {
            $rval = str_replace('GGGG', $this->_currentActivityGroup->groupName, $rval);
        }

        return $rval;
    }

    // With groups, the hotel selection has to trigger a lot of stuff.
    public function prGroupHotelSelectShortcode ($atts = array(), $content = null, $tag) {
        $atts['template'] = <<<EOT
<select class="pr_hotel_select" id="hotel_aAAAA" onchange="accommodation_setupTransportationRoutes({supplierId: SSSS, activityId: AAAA, agencyId: 0, hotelId: this.value, routeSelectionContextData: g_GGGG.transportation }); showPriceAndAvailability(g_GGGG);"></select>
<script type="text/javascript">accommodation_loadHotels({ supplierId: SSSS, activityId:  AAAA, agencyId: 0, hotelSelectSelector: "#hotel_aAAAA" });</script>
EOT;
        $atts['group'] = true;
        
        return $this->prHotelSelectShortcode($atts, $content, $tag);
    }
    
    public function prHotelRoomShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null
        ), $atts);

        $rval = sprintf('<input type="text" id="room_a%d" size="3" />',
                        $this->_currentActivity->id);
        
        return $rval;
    }
    
    public function prCheckAvailabilityShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'id' => null
        ), $atts);

        $defaultStyle = get_option('pr_default_style');

        // This might look lazy but Pono Rez is going to give me funny button names every time.
        $dsTrimmed = str_replace('-', '', $defaultStyle);

        if (!$defaultStyle) {
            $rval = sprintf('<input type="button" class="checkAvailability" activity-id="%d" value="Check availability" />',
                            $this->_currentActivity->id);
        }
        else {
            $rval = sprintf('<input type="image" class="checkAvailability" activity-id="%d" src="%s/%sbn.jpg" />',
                            $this->_currentActivity->id,
                            plugins_url('assets/images/buttons', dirname(__FILE__)),
                            $dsTrimmed);
        }
        
        return $rval;
    }

    public function prGroupShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null,
            'template' => $this->defaultTemplate
        ), $atts);

        $rval = '';
        
        try {
            if (null != $a['name']) {
                $this->setCurrentActivityGroup($a['name']);
            }
        }
        catch (SoapFault $e) {
            $rval .= sprintf("<br>\n<pre>\n%s\n</pre>",
                             $this->_soapDebug);

        }

        // Load our required group functions.
        wp_enqueue_script('pr_group_functions');
        
        // Now we assemble the JavaScript.
        $cag = $this->_currentActivityGroup;
        
        $javaScript = PR()->withTransient('pr_group', $cag->groupName, function () use ($cag) {
            return $cag->toJson(true);
        });

        return sprintf("<script>\n%s\n</script>", $javaScript);
    }

    /**
     * Set up transportation for a single activity.
     *
     * Requires JS like this:
     * var routeSelection_a8455_contextData = {
     *   routesContainerSelector: "#transportationRoutesContainer_a8455",
     *   routeSelectorMap: {
     *     '355': "#transportationRouteContainer_a8455_355",
     *     'null': null
     *   }
     * };
     *
     */
    public function prTransportationShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null,
            'message' => 'No transportation.',
            'template' => $this->defaultTemplate,
            'hidden' => true
        ), $atts);

        $trans = new PonoRezTransportation($this->_currentActivity->supplierId, $this->_currentActivity->id);
        $map = $trans->getTransportationMap();

        $javaScript = sprintf("var routeSelection_a%d_contextData = %s;",
                              $this->_currentActivity->id,
                              json_encode($map));

        $rval = sprintf("<script type=\"text/javascript\">%s</script>\n",
                        $javaScript);
        
        // If we're hidden, set our style.
        $displayStyle = '';
        if (true == $a['hidden'])
            $displayStyle = 'display:none;';
        
        $rval .= sprintf("<div id=\"%s\" style=\"%s\"><strong>Select a transportation route:</strong><br>\n",
                         substr($map['routesContainerSelector'], 1),
                         $displayStyle);

        $rval .= sprintf("<div><label><input type=\"radio\" name=\"transportationroute_a%d\" value=\"\" /> No Transportation</label></div>\n",
                         $this->_currentActivity->id);
        
        $routeNameTag = sprintf('transportationroute_a%d', $this->_currentActivity->id);
       
        foreach ($trans->getTransportationOptions() as $id => $routeName) {
            $tmp = sprintf('<div id="%s"><label><input name="%s" type="radio" value="%d" /> %s</label></div>',
                           $map['routeSelectorMap'][$id],
                           $routeNameTag,
                           $id,
                           $routeName);

            $rval .= "\n" . $tmp;
        }
        
        
        return $rval . "</div>";
    }
    
    public function prGroupTransportation ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null,
            'message' => 'No transportation.',
            'template' => $this->defaultTemplate
        ), $atts);

        $rval = '';

        // @TODO Turn this into JavaScript and incorporate it into prGroupShortcode?
        /*
<div id="transportationRoutesContainer_a7748" style="display: none;">Select a Transportation Route:</p>
<div><label><input name="transportationroute_a7748" type="radio" value="" />No Transportation; We will be Driving out to the Ranch.</label></div>
<div id="transportationRouteContainer_a7748_355"><label><input name="transportationroute_a7748" type="radio" value="355" />Transporation (an additional $15.71 pp)</label></div>
</div>
        */
        $map = $this->_currentActivityGroup->transportationMap();

        // Why so many substr() calls? Because everything has a # at the beginning.
        $rval = sprintf('<div id="%s" style="display:none;"><strong>Select a transportation route:</strong><br>',
                        substr($map['routesContainerSelector'], 1));

        $routeNameTag = sprintf('transportationroute_a%d', $this->_currentActivityGroup->activities[0]->id);

        $rval .= sprintf('<div><label><input name="%s" type="radio" value="" /> %s</label></div>',
                         $routeNameTag,
                         $a['message']);

        try {
            // We might need to use a SOAP call to import more data, such as route names.
            $serviceCreds = PR()->serviceLogin();
            $service = PR()->providerService();

            // @TODO These should be cached.
            foreach ($map['routeSelectorMap'] as $id => $route) {
                $result = $service->getTransportationRoute(array(
                    'serviceLogin' => $serviceCreds,
                    'supplierId' => $this->_currentActivityGroup->supplierId,
                    'transportationRouteId' => $id
                ));


                $tmp = sprintf('<div id="%s"><label><input name="%s" type="radio" value="%d" /> %s</label></div>',
                               $route,
                               $routeNameTag,
                               $id,
                               $result->return->name);

                $rval .= "\n" . $tmp;
            }
        }
        catch (Exception $e) {
            $rval = sprintf("<pre>%s\n</pre>\n", $e->getMessage());
        }
        
        return $rval . "</div>";

    }

    /**
     * Display a list of checkboxes for multiple activities in a group
     *
     * This is typically used to display multiple times for one
     * "activity". In PonoRez, multiple times are implemented as
     * multiple activities which are then grouped together external to
     * the PonoRez system.
     */
    public function prGroupTimesShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'notavailable' => '(Not Available)',
            'smarttimes' => false,
            'template' => $this->defaultTemplate
        ), $atts);

        $rval = '';

        $g = $this->_currentActivityGroup;

        // Load our template.
        if (null == $content) {
            $template =<<<EOT
<checkbox>
<times>
<not available><br>
EOT;
        } else {
            $template = $content;
        }
        
        // Template elements. @TODO Fix the group1 bits.
        $checkboxTemplate = '<input id="%s" type="checkbox" onclick="selectActivity(g_%s, this); showPriceAndAvailability(g_%s);">';
        $naTemplate = '<span class="pr_not_available_message" id="%s" style="display: none;">%s</span>';

        // Activity data.
        $cbIds = $g->activityCheckboxControlIds();
        $naIds = $g->activityNotAvailableMessageControlIds();

        // Debug
        //$rval = sprintf("<PRE>\n%s\n</PRE>\n", print_r($g->activities, true));
        
        foreach ($g->activities as $activity) {
            $tmp = str_replace(
                '<checkbox>',
                sprintf($checkboxTemplate,
                        $cbIds[$activity->id],
                        $g->groupName, $g->groupName),
                $template
            );

            $times = ('' == $activity->times) ? $activity->name : $activity->times;

            // If 'smarttimes' is enabled, try to pull an actual time out of the $times string.
            if ($a['smarttimes'] && 1 == preg_match('/\b([0-9]+:[0-9]+[ap]m)\b/', $times, $matches)) {
                $times = $matches[1];
            }
            
            $tmp = str_replace('<times>', $times, $tmp);
            $tmp = str_replace('<not available>', sprintf($naTemplate, $naIds[$activity->id], $a['notavailable']), $tmp);
            $rval .= $tmp;
        }

        return $rval;
    }

    public function prTotalPriceShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null
        ), $atts);
        $rval = '';

        if (null != $this->_currentActivityGroup) {
            $rval = sprintf('<span id="%s"></span>',
                            $this->_currentActivityGroup->priceControlId());
        }

        return $rval;
    }

    public function prPolicyCheckboxShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null,
            'class' => ''
        ), $atts);

        if (null == $this->_currentActivityGroup) {
            return '';
        }

        return sprintf('<input type="checkbox" class="%s" id="%s_%d" value="yes">',
                       implode(' ', array($this->_currentActivityGroup->cancellationPolicyControlId(),
                                          $a['class'])),
                       $this->_currentActivityGroup->cancellationPolicyControlId(),
                       $this->_cancellationPolicyCount++);
    }
                               
    public function prBookNowShortcode ($atts = array(), $content = null, $tag) {
        $a = shortcode_atts(array(
            'name' => null,
            'style' => get_option('pr_default_style'),
            'class' => ''
        ), $atts);

        // This might look lazy but Pono Rez is going to give me funny button names every time.
        $dsTrimmed = str_replace('-', '', $a['style']);

        if (!$dsTrimmed) {
            $rval = sprintf('<input type="button" class="pr_book_now" value="Check availability" onclick="booknow(g_%s);" />',
                            $this->_currentActivityGroup->groupName);
        }
        else {
            // '<input type="image" class="checkAvailability" activity-id="%d" src="%s/%sbn.jpg" />',
            $rval = sprintf('<input type="image" class="pr_book_now%s" src="%s/%sbn.jpg" onclick="booknow(g_%s);" value="Book Now" />',
                            ('' != $a['class']) ? ' ' . $a['class'] : '',
                            plugins_url('assets/images/buttons', dirname(__FILE__)),
                            $dsTrimmed,
                            $this->_currentActivityGroup->groupName);
        }
        
        return $rval;
    }
    
    public function registerShortcodes() {
        // Single activity shortcodes.
        add_shortcode('pr_activity',             array($this, 'prActivityShortcode'));
        add_shortcode('pr_activity_name',        array($this, 'prActivityNameShortcode'));
        add_shortcode('pr_activity_description', array($this, 'prActivityDescriptionShortcode'));
        add_shortcode('pr_datepicker',           array($this, 'prDatepickerShortcode'));
        add_shortcode('pr_guest_type_list',      array($this, 'prGuestTypeListShortcode'));
        add_shortcode('pr_guest_type',           array($this, 'prGuestTypeShortcode'));
        add_shortcode('pr_hotel_select',         array($this, 'prHotelSelectShortcode'));
        add_shortcode('pr_hotel_room',           array($this, 'prHotelRoomShortcode'));
        add_shortcode('pr_check_availability',   array($this, 'prCheckAvailabilityShortcode'));
        add_shortcode('pr_load_activity',        array($this, 'prLoadActivityShortcode'));
        add_shortcode('pr_guest',                array($this, 'prGuestShortcode'));
        add_shortcode('pr_transportation',       array($this, 'prTransportationShortcode'));

        // Group shortcodes. Some of the single activity codes work with this, too.
        add_shortcode('pr_group',                array($this, 'prGroupShortcode'));
        add_shortcode('pr_group_times',          array($this, 'prGroupTimesShortcode'));
        add_shortcode('pr_total_price',          array($this, 'prTotalPriceShortcode'));
        add_shortcode('pr_policy_checkbox',      array($this, 'prPolicyCheckboxShortcode'));
        add_shortcode('pr_book_now',             array($this, 'prBookNowShortcode'));
        add_shortcode('pr_trans',                array($this, 'prGroupTransportation'));
        add_shortcode('pr_group_hotel_select',   array($this, 'prGroupHotelSelectShortcode'));
        add_shortcode('pr_group_transportation', array($this, 'prGroupTransportation'));
    }
    
    public function loadScripts () {
        // Note that the "calendar_js.jsp" file includes jQuery with
        // the UI core and datepicker extensions. WordPress provides
        // both of those, so we'll use the built-in. That means we
        // need our own version of calendar_js.jsp that only includes
        // the custom functions. It is included with this plugin.
        wp_enqueue_script('pr_accommodation', plugins_url('assets/pr_accommodation.min.js', dirname(__FILE__)),
                          array('jquery'));
        wp_enqueue_script('pr_calendar', plugins_url('assets/pr_calendar.min.js', dirname(__FILE__)),
                          array('jquery', 'jquery-ui-core', 'jquery-ui-datepicker', 'pr_accommodation'));
        wp_enqueue_script('pr_functions', plugins_url('assets/pr_functions.min.js', dirname(__FILE__)),
                          array('jquery', 'pr_calendar'), null);
        wp_enqueue_script('pr_document', plugins_url('assets/pr_document.min.js', dirname(__FILE__)),
                          array('jquery', 'pr_functions'));

        // Not automatically loaded.
        wp_register_script('pr_group_functions', plugins_url('assets/pr_group_functions.min.js', dirname(__FILE__)),
                          array('jquery', 'pr_functions'), null);

        // Add calendar-specific stylesheets. Note that this can be set by options.
        $defaultStyle = get_option('pr_default_style');
        if (!$defaultStyle) {
            $defaultStyle = 'ui-lightness';
        }
        $styleUrl = sprintf('%s/%s/jquery-ui.css',
                            plugins_url('assets/css/themes', dirname(__FILE__)),
                            $defaultStyle);

        wp_enqueue_style('pr_calendar_css', $styleUrl, false, null);
        wp_enqueue_style('pr_datepicker_css', plugins_url('assets/css/datepicker_availability.css', dirname(__FILE__)));
    }

    public function init () {
        $this->loadScripts();
        $this->registerShortcodes();

        $defaultTemplate = get_option('pr_default_template');

        if (!$defaultTemplate) {
            $defaultTemplate = 'activity-default';
        }

        $this->defaultTemplate = realpath(dirname(__FILE__) . '/../') . '/templates/' . $defaultTemplate . '.html';
    }
}