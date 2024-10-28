/*
* Functions for the Admin panel interface.
*/

function prDeleteGroups () {
  var groupNames = jQuery('.pr_group_name:checked').map(function (i, e) {
    return jQuery(e).attr('pr-group-name');
  });

  if (0 == groupNames.length) return false;

  jQuery.get(
    ajaxurl,
    { action: 'pr_delete_groups',
      groups: groupNames.toArray() },
    function (event) {
      prUpdateActivityList();
    });
}

// Collect checkboxes and group info.
function prAddGroup () {
  // Selecting just the checked boxes and collecting their IDs.
  var idList = jQuery('.pr_activity_id:checked').map(function (i, e) {
    return jQuery(e).attr('pr-activity-id');
  });
  var groupName = jQuery('#pr_group_name').val();

  // Check our inputs.
  if (0 == idList.length) {
    alert('Please select activities first.');
    return;
  }

  if (!groupName) {
    alert('Please enter a group name first.');
    return;
  }

  // Call the AJAX function that adds stuff.
  jQuery.get(
    ajaxurl,
    { action : 'pr_store_group',
      idlist : idList.toArray(),
      groupname : groupName },
    function (event) {
      if (true == event['success']) {
        prUpdateActivityList();
      } else {
        console.log(event['message']);
      }
    });
}

// Update the list of activities and groups.
function prUpdateActivityList (filter) {
  if (!filter)
    filter = new Object();
  
  var formData = filter;

  formData.action = 'pr_activity_list';

  //console.log('Executing action: ' + JSON.stringify(formData));
  jQuery.get(ajaxurl, formData, function (result) {
    jQuery('#prActivityTable').html(result);
  });        
}

jQuery(document).ready(function () {
  // Update the activity list right when the document is ready.
  prUpdateActivityList();

  // Bind our group button.
  jQuery(document).on('click', '#pr_add_group', function (event) {
    prAddGroup();
  });

  // Bind our refresh button.
  jQuery(document).on('click', '#pr_refresh', function (event) {
    prUpdateActivityList();
  });

  // Bind our group delete button.
  jQuery(document).on('click', '#pr_delete_groups', function (event) {
    prDeleteGroups();
  });

  // Bind our filter and pagination buttons/links

  jQuery(document).on('click', '#pra_filter_go', function (event) {
    var filter = jQuery('#pra_activity_filter').val();
    var args = { pra_filter : filter };

    prUpdateActivityList(args);
  });

  jQuery(document).on('click', '#pra_prev_page', function (event) {
    var filter = jQuery('#pra_activity_filter').val();
    var args = { pra_filter : filter,
                 pra_page : jQuery('#pra_prev_page').attr('data-page'),
                 pra_count : jQuery('#pra_prev_page').attr('data-count') };

    event.preventDefault();
    prUpdateActivityList(args);
  });

  jQuery(document).on('click', '#pra_next_page', function (event) {
    var filter = jQuery('#pra_activity_filter').val();
    var args = { pra_filter : filter,
                 pra_page : jQuery('#pra_next_page').attr('data-page'),
                 pra_count : jQuery('#pra_next_page').attr('data-count') };

    event.preventDefault();
    prUpdateActivityList(args);
  });
});
