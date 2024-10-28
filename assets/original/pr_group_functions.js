/** Booking functions for accordian booking pages

    - Some of these functions originated in https://www.hawaiifun.org/reservation/external/functions2.js?jsversion=20121209&ver=20121209
      They are marked in comments as "F2".
    - Others are from the booking code handed out by Pono Rez on group setup. They are not marked in comments.
*/

// F2
var baseurl = 'https://www.hawaiifun.org/reservation/';
if (getBaseUrl().match(/^https?:\/\/[a-z]+[:\/]/) || getBaseUrl().match(/reservation_test/)) // single-word hostname
{
  baseurl = getBaseUrl();
}

// F2
function getBaseUrl()
{
  var myName = /^(.*[\/\\])external\/functions2\.js(?:\?|$)/;
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src;
    if (src && src.match(myName)) {
      return RegExp.$1;
    }
  }

  return '';
}

// F2
function checkAvailability(callback, activityid, activitydate, minavailability) {
  jQuery.ajax({
    type: 'GET',
    url: baseurl + 'externalservlet',
    dataType: 'jsonp',
    success: callback,
    error: function(XMLHttpRequest, textStatus, errorThrown) { alert(baseurl + ' ' + textStatus + ' ' + errorThrown); },
    data: {
      action: 'AVAILABILITYCHECKJSONP',
      activityid: jQuery.makeArray(activityid).join('|'),
      activitydate: activitydate,
      minavailability: JSON.stringify(minavailability)
    }
  });
}

// F2
function purchase(data) {
  var deferred = $.Deferred();

  jQuery.ajax({
    type: 'GET',
    url: baseurl + 'externalservlet',
    dataType: 'jsonp',
    data: {
      action: 'PURCHASEJSONP',
      activityid: data.activityid,
      activitydate: data.activitydate,
      guestsandupgrades: JSON.stringify(data.guestsandupgrades),
      price: data.price,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      email: data.email,
      ccfirstname: data.ccfirstname,
      cclastname: data.cclastname,
      ccnumber: data.ccnumber,
      csc: data.csc,
      ccmonth: data.ccmonth,
      ccyear: data.ccyear,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      hotelid: data.hotelid,
      room: data.room,
      transportationrouteid: data.transportationrouteid,
      checklist: JSON.stringify(data.checklist)
    },
    statusCode: {
      200: function (data, textStatus, jqXHR) {
        if (data.errorMessage)
        {
          deferred.reject(data.errorMessage);
        }
        else
        {
          deferred.resolve(data);
        }
      },
      500: function (jqXHR, textStatus, errorThrown) {
        deferred.reject(jqXHR.responseText);
      }
    }
  });

  return deferred.promise();
}

// End F2 functions

function showCalendar(group) {
  var minavailability = { guests: {} };
  var failure = false;
  var totalGuestCount = 0;
  
  jQuery.each(group.guesttypeids, function(key, value) {
    if (failure) return;
    var guesttypeid = value;
    var guestscount = getGuestsCount(group, guesttypeid, false);

    if (null != guestscount) {
      totalGuestCount += guestscount;
      minavailability.guests[guesttypeid] = guestscount;
    }
  });

  // Debug
  //console.log('Guest availability: ' + JSON.stringify(minavailability));
  
  if (0 == totalGuestCount) {
    alert('Please select guest count for all guest types');
    //return null;
  }
  else {
    // Show calendar (only if all guest type counts are correct)
    calendar(group.activityids, group.datecontrolid, false, minavailability, new Date().getDate()<25?1:2);
  }
}

function formatMoney(n) {
  var c = 2,
      d = ".",
      t = ",",
      s = n < 0 ? "-" : "",
      i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
      j = (j = i.length) > 3 ? j % 3 : 0;
  
  return s + (j ? i.substr(0, j) + t : "")
    + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t)
    + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

function showPriceAndAvailability(group) {
  var activityid = getSelectedActivityId(group, false);
  var activitydate = getActivityDate(group, false);
  var minavailability = { guests: {} };
  var transportationrouteid = getTransportationRouteId(group);
  var price = 0.0;
  var failure = false;
  var totalGuestCount = 0;
  
  jQuery.each(group.guesttypeids, function(key, value) {
    if (failure) return;
    var guesttypeid = value;
    var guestscount = getGuestsCount(group, guesttypeid, false);
    
    if (guestscount == null) {
      //failure = true;
      guestscount = 0;
    } else {
      if (activityid != null) {
        var guesttypeprice = group.activityprices[activityid][guesttypeid];
        price += guestscount * guesttypeprice;
        if (transportationrouteid == 355)
        {
          price += guestscount * 15.71;
        }
      }
      minavailability.guests[guesttypeid] = guestscount;
      totalGuestCount += guestscount;
    }
  });

  // At this point, if guest count is 0, it's a failure. -- @ELA
  if (0 == totalGuestCount)
    failure = true;
  
  // Show total price (only if activity is selected and all guest type counts are correct)
  if (activityid != null && !failure) {
    jQuery('#' + group.pricecontrolid).html('$' + formatMoney(price));
  } else {
    jQuery('#' + group.pricecontrolid).html('');
  }

  if (activitydate != null && !failure) {
    checkAvailability(function(data) {
      jQuery.each(group.activityids, function(key, value) {
        // Enable or disable activities based on availability (only if activity date is selected and all guest types are correct)
        var activityid = value;
        if (!data[activityid]) jQuery('#' + group.activitycheckboxcontrolids[activityid]).attr('checked', false);
        jQuery('#' + group.activitycheckboxcontrolids[activityid]).prop('disabled', !data[activityid]);
        jQuery('#' + group.activitydescriptioncontrolids[activityid]).css('color', data[activityid] ? 'black' : 'gray');
        jQuery('#' + group.activitynotavailablemessagecontrolids[activityid]).toggle(!data[activityid]);
      });
    }, group.activityids, activitydate, minavailability);
  }
}

function getSelectedActivityId(group, showWarningIfNoActivitySelected) {
    var activityid = null;
    jQuery.each(group.activityids, function(key, value) {
        if (jQuery('#' + group.activitycheckboxcontrolids[value]).is(':checked')) activityid = value;
    });
    if (activityid == null && showWarningIfNoActivitySelected) {
        alert('Please select seating package');
    }
    return activityid;
}

function getGuestsCount(group, guestTypeId, showWarningIfWrongFormat) {
  var guestscountstr = jQuery('#' + group.guesttypecontrolids[guestTypeId]).val();

  if (guestscountstr == '')
    return 0;
  
  if (!/^\d+$/.test(guestscountstr)) {
    if (showWarningIfWrongFormat) {
      alert('Please select guest count');
    }
    return null;
  }
  
  return parseInt(guestscountstr);
}

function getActivityDate(group, showWarningIfWrongFormat) {
    var activitydatestr = jQuery('#' + group.datecontrolid).val();
    if (!/^\d\d?\/\d\d?\/\d\d\d\d$/.test(activitydatestr)) {
        if (showWarningIfWrongFormat) {
            alert('Please select activity date');
        }
        return null;
    }
    return activitydatestr;
}

function getTransportationRouteId(group) {
    return jQuery('[name=\'' + group.transportationroutecontrolname + '\']:visible:checked').val();
}

function getPromotionalCode(group) {
    return jQuery('#' + group.promotionalcodecontrolid).val();
}

function getHotelId(group) {
    return jQuery('#' + group.hotelcontrolid).val();
}

function getRoom(group) {
    return jQuery('#' + group.roomcontrolid).val();
}

function selectActivity(group, selectedcheckbox) {
    if (!selectedcheckbox.checked) return;
    jQuery.each(group.activityids, function(key, value) {
        if (selectedcheckbox.id == group.activitycheckboxcontrolids[value]) return;
        jQuery('#' + group.activitycheckboxcontrolids[value]).attr('checked', false);
    });
}

/**
  This function has been modified from the Pono Rez standard in order
  to handle multiple control policy checkboxes.
 */
function booknow(group) {
  // Collect checkboxes. They must all be checked!
  var unchecked = jQuery('.' + group.cancellationpolicycontrolid + ':not(:checked)');
  if (0 < unchecked.length) {
    alert('Please check cancellation policy');
    return false;
  }
  
  var activityid = getSelectedActivityId(group, true);
  if (activityid == null)
    return false;

  var activitydate = getActivityDate(group, true);
  if (activitydate == null)
    return false;

  reservation(group.supplierid, activityid, activitydate, '', 0.0);

  jQuery.each(group.guesttypeids, function(key, value) {
    var guesttypeid = value;
    var guestscount = jQuery('#' + group.guesttypecontrolids[guesttypeid]).val();

    // Only add guests if it's available. Some guest types may not be present.
    if (guestscount) {
      addGuests(guesttypeid, guestscount);
    }
  });
  
  setHotel(getHotelId(group)); setRoom(getRoom(group)); setTransportationRoute(getTransportationRouteId(group)); setAccommodationFixed();
  setpromotionalcode(getPromotionalCode(group));

  // This pops up that "C h e c k i n g" window that doesn't do anything.
  availability_popup();
  
  return true;
}

