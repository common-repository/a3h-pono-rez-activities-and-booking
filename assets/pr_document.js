jQuery(document).ready(function () {
  jQuery(document).on('click', '.checkAvailability', function (event) {
    var activityId = jQuery(this).attr('activity-id');
    var activityDate = jQuery('#date_a' + activityId).val();

    if ('' == activityDate) {
      alert('Please select a date first.');

      return false;
    }
    
    reservation2(activityId, activityId, activityDate, '', 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    // Collect guest data from the form.
    var totalGuestCount = 0;
    jQuery('.guestCount' + activityId).each(function (idx, item) {
      var guestTypeId = item.getAttribute('guest-type-id');
      var guestCount = item.value;

      addGuests(guestTypeId, guestCount);
      totalGuestCount += guestCount;
    });

    if (0 == totalGuestCount) {
      alert('Please select the number of guests first.');

      return false;
    }
    
    setUpgradesFixed();
    setHotel(jQuery('#hotel_a' + activityId).val());
    setRoom(jQuery('#room_a' + activityId).val());
    setAccommodationFixed();
    availability_popup();
    
    return false;
  });
});
