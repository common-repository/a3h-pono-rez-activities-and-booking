// Functions loaded to enhance jQuery UI Datepicker
// Note: This code was originally found in https://www.hawaiifun.org/reservation/common/calendar_js.jsp?jsversion=20151110
(function( $, undefined ) {

  $.fn.datepicker_async = function(options) {
    this.each(function() {
      var $target = $(this);
      var inst;

      options = $.extend({}, options, { onChangeMonthYear: prepareMonth });

      $target.datepicker(options);
      inst = getDatepickerInstance($target);

      var initialDate = $target.datepicker('getDate');
      if (initialDate == null) initialDate = Date();
      prepareMonth(initialDate.getFullYear(), 1 + initialDate.getMonth(), inst);
    });

    return this;
  };

  function prepareMonth(year, month, inst)
  {
    inst.asyncPrepareMonthPromise = null;
    setCalendarMask(inst, null);

    if (!inst.settings.onPrepareMonthBegin)
    {
      return;
    }

    var promise = inst.settings.onPrepareMonthBegin(year, month, inst);
    if (promise)
    {
      inst.asyncPrepareMonthPromise = promise;
      setCalendarMask(inst, 'loading');

      // The mask we created earlier will be deleted because the datepicker HTML
      // will be completely recreated *after* the onChangeMonthYear callback
      // returns. So we'll reapply the mask with a timer.
      // (Note that this issue doesn't exist when the calendar is being created.)
      var reapplyMaskFunc = function() {
        applyCalendarMask(inst);
      };
      var applyMaskTimeout = setTimeout(reapplyMaskFunc, 0);

      // Masking with a timer works reliably but creates flicker. So we also try
      // a less reliable method to get control immediately after the datepicker HTML
      // is regenerated: binding to a 'click' event that is be the most often used
      // (or even the only) method of switching month.
      // (Note that this doesn't work in IE7/8 as the 'click' event is not bubbled.)
      $(getDatepickerElement(inst)).one('click', reapplyMaskFunc);

      promise.done(function() {
        clearTimeout(applyMaskTimeout);
        $(getDatepickerElement(inst)).off('click', reapplyMaskFunc);

        if (inst.asyncPrepareMonthPromise != promise) return;
        inst.asyncPrepareMonthPromise = null;

        setCalendarMask(inst, null);
        $(getDatepickerElement(inst)).datepicker('refresh');
      });
      promise.fail(function() {
        clearTimeout(applyMaskTimeout);
        $(getDatepickerElement(inst)).off('click', reapplyMaskFunc);

        if (inst.asyncPrepareMonthPromise != promise) return;
        inst.asyncPrepareMonthPromise = null;

        setCalendarMask(inst, 'failed');
      });
    }
  }

  function setCalendarMask(inst, mask)
  {
    inst.asyncRequestedMask = mask;
    applyCalendarMask(inst);
  }

  function applyCalendarMask(inst)
  {
    // We try to prevent unnecessary mask re-application by checking
    // if the currently existing mask matches the requested mask.
    var appliedMask = getExistingCalendarMask(inst);

    if (appliedMask && appliedMask != inst.asyncRequestedMask)
    {
      unmaskCalendar(inst);
    }

    if (inst.asyncRequestedMask && inst.asyncRequestedMask != appliedMask)
    {
      switch (inst.asyncRequestedMask)
      {
        case 'loading':
        maskCalendarLoading(inst);
        break;
        case 'failed':
        maskCalendarFailed(inst);
        break;
      }
    }
  }

  function unmaskCalendar(inst)
  {
    $(getDatepickerElement(inst)).find(".datepicker-async-mask").remove();
    $(getDatepickerElement(inst)).find("table.ui-datepicker-calendar tbody").css( { visibility: 'inherit' });
  }

  function maskCalendarLoading(inst)
  {
    $(getDatepickerElement(inst)).find("table.ui-datepicker-calendar").each(function() {
      var $calendar = $(this).find("tbody");
      $calendar.css({ visibility: 'hidden' });

      var $mask = $("<div></div>")
          .addClass('datepicker-async-mask').data('mask', 'loading')
          .css({ position: isPositionFixed($calendar) ? 'fixed' : 'absolute' })
          .insertAfter($(this));
      $("<div>Loading...</div>")
        .css({ marginTop: '3.5em', width: '100%', textAlign: 'center' })
        .appendTo($mask);
      coverWithMask($calendar, $mask);
    });
  }

  function maskCalendarFailed(inst)
  {
    $(getDatepickerElement(inst)).find("table.ui-datepicker-calendar").each(function() {
      var $calendar = $(this).find("tbody");
      $calendar.css({ visibility: 'hidden' });

      var $mask = $("<div></div>")
          .addClass('datepicker-async-mask').data('mask', 'failed')
          .css({ position: isPositionFixed($calendar) ? 'fixed' : 'absolute' })
          .insertAfter($(this));
      $("<div>Failed to load</div>")
        .css({ marginTop: '3.5em', width: '100%', textAlign: 'center' })
        .appendTo($mask);
      coverWithMask($calendar, $mask);
    });
  }

  function getExistingCalendarMask(inst)
  {
    return $(getDatepickerElement(inst)).find(".datepicker-async-mask").data('mask');
  }

  function isPositionFixed($element)
  {
    var isFixed = false;
    $element.parents().each(function() {
      isFixed |= $(this).css("position") === "fixed";
      return !isFixed;
    });

    return isFixed;
  }

  function coverWithMask($target, $mask)
  {
    var targetOffset = $target.offset();
    var maskOriginalOffset = $mask.offset();
    $mask.css({
      width: $target.width() + 'px',
      height: $target.height() + 'px',
      marginLeft: targetOffset.left - maskOriginalOffset.left,
      marginTop: targetOffset.top - maskOriginalOffset.top
    });
  }

  function getDatepickerInstance($target)
  {
    return $target.data('datepicker');
    // Widget factory would use 'ui-datepicker', but as of 1.10.2 datepicker
    // is not a factory's widget.
  }

  function getDatepickerElement(inst)
  {
    return inst.input;
    // Widget factory would use '.element'.
  }

})(jQuery);

function reservationcalendar_getBaseUrlWithReservation()
{
  var url = 'https://www.hawaiifun.org/reservation/';
  if (/reservation\/$/.test(url) || /reservation_test\/$/.test(url) || /reservation-alt\/$/.test(url))
  {
    // Leave as is.
  }
  else if (/perfecthawaiivacationguide.com$/.test(window.location.hostname) || /^(\w+\.)*hawaiifun\.org$/.test(window.location.hostname) || /^(\w+\.)*hawaiifunfusion\.com/.test(window.location.hostname))
  {
    url = 'https://www.hawaiifun.org/reservation/';
  }
  else
  {
    url += 'reservation/';
  }

  return url;
}

(function($) {

  var reservationcalendar_availability = [];
  var reservationcalendar_datepickerPanel = null;

  window.calendar = function(activityId, field, local, minavailability, numberOfMonths) {
    showAvailabilityCalendar2(activityId, field, { local: local, webBooking: true, minavailability: minavailability, numberOfMonths: numberOfMonths });
  };

  window.showSimpleCalendar = function(fieldId, anchorId, options) {
    var $field = $('#' + fieldId);
    var $anchor = (anchorId ? $('#' + anchorId) : $field);

    if ($field.length == 0) return;
    if ($anchor.length == 0) $anchor = $field;

    var $panel = reservationcalendar_createDatepickerPanel($anchor);

    var calendarOptions = {
      showOn: 'none',
      showAnim: ''
    };
    if (typeof options != 'undefined')
    {
      $.extend(calendarOptions, options)
    }
    $panel.datepicker(calendarOptions);

    // Add class for compatibility with the old (modified) availability datepicker.
    $panel.find(".ui-datepicker").addClass('ui-datepicker_availability');

    var initialDateSeconds = Date.parse($field.val());
    $panel.datepicker('setDate', initialDateSeconds ? new Date(initialDateSeconds) : null);

    reservationcalendar_placePanelNearAnchor($panel, $anchor);
    reservationcalendar_connectDatepickerToField($panel, $field);
    $panel.css({ visibility: 'inherit' });

    reservationcalendar_datepickerPanel = $panel.get(0);
  };

  // Replaced by showAvailabilityCalendar2 but is used in old external/agencyexternal code.
  window.showAvailabilityCalendar = function(activityId, agencyId, fieldId, anchorId, local) {
    if (local == null) local = true;
    if (!/^\d+$/.test(activityId) || !activityId)
    {
      alert('Please select activity');
      return;
    }

    showAvailabilityCalendar2(activityId, fieldId, { agencyId: agencyId, anchorId: anchorId, local: local });
  };

  window.showAvailabilityCalendar2 = function(activityId, fieldId, options) {
    var agencyId = (options['agencyId'] != null ? options['agencyId'] : 0);
    var blocksOnly = (options['blocksOnly'] != null ? options['blocksOnly'] : false);
    var anchorId = (options['anchorId'] != null ? options['anchorId'] : null);
    var local = (options['local'] != null ? options['local'] : false);
    var webBooking = (options['webBooking'] != null ? options['webBooking'] : true);
    var hawaiifunBooking = (options['hawaiifunBooking'] != null ? options['hawaiifunBooking'] : false);
    var agencyBooking = (options['agencyBooking'] != null ? options['agencyBooking'] : false);
    var minAvailability = (options['minavailability'] != null ? options['minavailability'] : undefined);
    var numberOfMonths = (options['numberOfMonths'] != null ? options['numberOfMonths'] : undefined);

    var activityIdArray = $.makeArray(activityId);
    var haveBadActivityId = $.grep(activityIdArray, function(i) { return !/^\d+$/.test(i) || !i }).length;
    if (activityIdArray.length == 0 || haveBadActivityId)
    {
      alert('Please select activity');
      return;
    }

    var baseurl = (local ? "" : reservationcalendar_getBaseUrlWithReservation());
    var $field = $('#' + fieldId);
    var $anchor = (anchorId ? $('#' + anchorId) : $field);
    var minAvailabilityStr = typeof(minAvailability) == 'undefined' ? '' : JSON.stringify(minAvailability);
    var activityIdStr = $.makeArray(activityId).join('|');

    if ($field.length == 0) return;

    if ($anchor.length == 0) $anchor = $field;
    if (typeof(numberOfMonths) == 'undefined') numberOfMonths = 1;

    var $panel = reservationcalendar_createDatepickerPanel($anchor);
    $panel.datepicker_async({
      numberOfMonths: typeof(numberOfMonths) == 'undefined' ? 1 : numberOfMonths,
      onPrepareMonthBegin: function (year, month, inst) {
        var yms = [];
        for (var i = 0, y = year, m = month; i < numberOfMonths; ++i, ++m)
        {
          if (m > 12)
          {
            m -= 12;
            y++;
          }

          if (!(activityIdStr + '_' + agencyId + '_' + y + '_' + m + '_' + minAvailabilityStr in reservationcalendar_availability))
          {
            yms.push(y + '_' + m);
          }
        }

        if (yms.length == 0)
        {
          return null; // All months are already loaded, no need for asynchronous handling.
        }

        var deferred = $.Deferred();

        $.ajax({
          type: 'GET',
          url: baseurl + 'companyservlet',
          dataType: 'jsonp',
          data: {
            action: 'COMMON_AVAILABILITYCHECKJSON',
            activityid: activityIdStr,
            agencyid: agencyId,
            blocksonly: blocksOnly,
            year_months: yms.join('|'),
            webbooking: webBooking,
            hawaiifunbooking: hawaiifunBooking,
            agencybooking: agencyBooking,
            minavailability: minAvailabilityStr
          }
        })
          .done(function(data) {
            for (i = 0; i < yms.length; i++)
            {
              reservationcalendar_availability[activityIdStr + '_' + agencyId + '_' + yms[i] + '_' + minAvailabilityStr] = data['yearmonth_' + yms[i]];
            }
            deferred.resolve();
          })
          .fail(function(xhr, textStatus, errorThrown) {
            alert(baseurl + ' ' + textStatus + ' ' + errorThrown);
            deferred.reject();
          });

        return deferred.promise();
      },
      beforeShowDay: function(date) {
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var y = date.getFullYear();

        var idx = activityIdStr + '_' + agencyId + '_' + y + '_' + m + '_' + minAvailabilityStr;

        if (!(idx in reservationcalendar_availability) || !('d' + d in reservationcalendar_availability[idx]))
        {
          return [false];
        }
        else if (reservationcalendar_availability[idx]['d' + d] <= 0)
        {
          return [false, 'un', 'Not Available'];
        }
        else
        {
          return [true];
        }
      }
    });

    // Add class for compatibility with the old (modified) availability datepicker.
    $panel.find(".ui-datepicker").addClass('ui-datepicker_availability');

    var initialDateSeconds = Date.parse($field.val());
    $panel.datepicker('setDate', initialDateSeconds ? new Date(initialDateSeconds) : null);

    reservationcalendar_placePanelNearAnchor($panel, $anchor);
    reservationcalendar_connectDatepickerToField($panel, $field);
    $panel.css({ visibility: 'inherit' });

    reservationcalendar_datepickerPanel = $panel.get(0);
  };

  window.reservationcalendar_createDatepickerPanel = function($anchor) {
    if (reservationcalendar_datepickerPanel)
    {
      var $oldPanel = $(reservationcalendar_datepickerPanel);
      if ($oldPanel.data('datepicker'))
      {
        $oldPanel.datepicker('destroy');
        $oldPanel.remove();
      }
      reservationcalendar_datepickerPanel = null;
    }

    var isFixed = false;
    $anchor.parents().each(function() {
      isFixed |= $(this).css("position") === "fixed";
      return !isFixed;
    });

    return $("<div></div>")
      .css({
        paddingTop: '1px', paddingBottom: '1px',
        position: isFixed ? 'fixed' : 'absolute', visibility: 'hidden',
        zIndex: $anchor.zIndex() // zIndex() is from jquery-ui core
      })
      .appendTo($anchor.closest("body"));
  };

  window.reservationcalendar_placePanelNearAnchor = function($panel, $anchor) {
    $panel.css({ left: 0, top: 0 });

    var originalPanelPosition = $panel.offset();
    var panelSize = { width: $panel.outerWidth(), height: $panel.outerHeight() };
    var anchorPosition = $anchor.offset();
    var anchorSize = { width: $anchor.outerWidth(false), height: $anchor.outerHeight(false) };

    var $document = $($panel.get(0).ownerDocument);
    var $window = $(reservationcalendar_getElementWindow($panel));
    var viewDimensions = {
      left: $document.scrollLeft(), top: $document.scrollTop(),
      width: $window.width(), height: $window.height()
    };

    // Fit position vertically.
    var primaryPanelPosition = { left: anchorPosition.left, top: anchorPosition.top + anchorSize.height };
    var altPanelPosition = { left: anchorPosition.left, top: anchorPosition.top - panelSize.height };

    var primaryVerticallyVisible = reservationcalendar_checkVerticalVisibility(primaryPanelPosition, panelSize, viewDimensions);
    var altVerticallyVisible = reservationcalendar_checkVerticalVisibility(altPanelPosition, panelSize, viewDimensions);
    var selectedPanelPosition = (!primaryVerticallyVisible && altVerticallyVisible ? altPanelPosition : primaryPanelPosition);

    // Adjust position horizontally.
    if (selectedPanelPosition.left + panelSize.width > viewDimensions.left + viewDimensions.width)
    {
      selectedPanelPosition.left = Math.max(
        viewDimensions.left,
        viewDimensions.left + viewDimensions.width - panelSize.width);
    }

    $panel.css({
      left: (selectedPanelPosition.left - originalPanelPosition.left) + 'px',
      top: (selectedPanelPosition.top - originalPanelPosition.top) + 'px'
    });
  };

  window.reservationcalendar_connectDatepickerToField = function($panel, $field) {
    var setupTimeout = null;
    var lastInputValue = null;

    var destroyDatepicker = function() {
      if (setupTimeout) clearTimeout(setupTimeout);

      $field.off('input', onFieldChange);
      $field.off('onpropertychange', onFieldChange);
      $field.off('keyup', onFieldChange);

      $panel.off('click', onPanelClick);
      $panel.closest("html").off('click', onDocumentClick);

      $panel.datepicker('destroy');
      $panel.remove();
    };

    var onFieldChange = function(ev) {
      var inputValue = $field.val();
      if (inputValue === lastInputValue) return;

      var dateSeconds = Date.parse(inputValue);
      $panel.datepicker('setDate', dateSeconds ? new Date(dateSeconds) : null);
      lastInputValue = inputValue;
    };
    var onDocumentClick = function(ev) {
      destroyDatepicker();
    };
    var onPanelClick = function(ev) {
      ev.stopPropagation();
    };

    $panel.datepicker('option', 'onSelect', function(dateText, inst) {
      $field.val(dateText);
      $field.change();
      destroyDatepicker();
    });

    // Bind events that are fired when input is changed in various browsers:
    $field.on('input', onFieldChange);
    $field.on('onpropertychange', onFieldChange);
    $field.on('keyup', onFieldChange);

    setupTimeout = setTimeout(function() {
      // We set up click handlers asynchronously to prevent onDocumentClick from
      // being called immediately when bubbling click event, *if* we are creating
      // a datepicker in response to this very event.
      $panel.on('click', onPanelClick);
      $panel.closest("html").on('click', onDocumentClick);
    }, 0);
  };

  window.reservationcalendar_getElementWindow = function($element) {
    var doc = $element.get(0).ownerDocument;
    return doc.defaultView || doc.parentWindow;
  };

  window.reservationcalendar_checkVerticalVisibility = function(panelPosition, panelSize, viewDimensions) {
    return (panelPosition.top >= viewDimensions.top
            && panelPosition.top + panelSize.height <= viewDimensions.top + viewDimensions.height);
  };

})(jQuery);
