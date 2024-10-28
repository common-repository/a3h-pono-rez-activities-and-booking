var Accommodation = (function() {
  var dataOfActivityById = {};
  var routeDataBySupplierId = {};

  var activityDeferredById = {};
  // Once this is resolved, the corresponding dataOfActivityById and routeDataBySupplierId
  // values are assumed to be set.

  var m;

  var initHotels = function(supplierId, activityId, agencyId, $hotelSelect, routeSelectionContextData) {
    $hotelSelect.empty();

    var hotelInfosOfActivity = dataOfActivityById[activityId].hotelInfos;
    var localResidenceHotelInfo = null;
    var localResidenceHotelId = null;
    jQuery.each(hotelInfosOfActivity, function() {
      if (this.special == 'localResidence')
      {
        localResidenceHotelInfo = this;
        localResidenceHotelId = this.id;
        return false;
      }
    });

    if (localResidenceHotelInfo != null)
    {
      $hotelSelect.append(jQuery("<option />").attr('value', localResidenceHotelInfo.id).text(''));
    }
    for (var i = 0; i < hotelInfosOfActivity.length; ++i)
    {
      var hotelInfo = hotelInfosOfActivity[i];
      if (hotelInfo.id == localResidenceHotelId) continue;

      $hotelSelect.append(jQuery("<option />").attr('value', hotelInfo.id).text(hotelInfo.name));
    }

    if (routeSelectionContextData)
    {
      m.setupTransportationRoutes({ supplierId: supplierId, activityId: activityId, agencyId: agencyId, hotelId: $hotelSelect.val(), routeSelectionContextData: routeSelectionContextData });
    }
  };

  var getPromiseResult = function(promise) {
    var savedResult;
    promise.done(function(result) { savedResult = result; });

    return savedResult;
  };

  m = {
    loadHotels: function(params) {
      // params: { supplierId, activityId, agencyId, hotelSelectSelector, (optional) routeSelectionContextData }

      // supplierId is assumed to match activityId; that is, we won't be called with the same activityId
      // but different supplierId.

      var $hotelSelect = jQuery(params.hotelSelectSelector);

      // 1.
      // Ensure that activityDeferredById[activityId] exists and is either resolved or pending;
      // this means initiating the JSON request for the data we want, if we don't have this data
      // ready or in process of retrieval.

      if (!activityDeferredById[params.activityId] || activityDeferredById[params.activityId].state() == 'rejected')
      {
        var activityDeferred = jQuery.Deferred();

        var lackRouteData = !routeDataBySupplierId[params.supplierId];
        var postData = { supplierid: params.supplierId, activityid: params.activityId, wantroutedata: lackRouteData };

        var assumedTimeout = false;
        // Wait for completion no more than 30 seconds:
        setTimeout(function() { assumedTimeout = true; activityDeferred.reject(); }, 30 * 1000);

        jQuery.post(baseurl + 'externalservlet?action=GETTRANSPORTATIONDATA_JSONP', postData, null, 'jsonp')
        .done(function(response) {
          if (assumedTimeout)
          {
            // Too late, we already assumed timeout.
            return;
          }

          if (response.errorMessage)
          {
            alert('Failed to retrieve hotel list: ' + response.errorMessage);
            activityDeferred.reject();
            return;
          }

          var responseDataOfActivity = response.dataOfActivityById && response.dataOfActivityById[params.activityId];
          var responseRouteData = response.routeData;

          if (!responseDataOfActivity || (lackRouteData && !responseRouteData))
          {
            // We didn't get what we wanted, for some reason.
            activityDeferred.reject();
            return;
          }

          dataOfActivityById[params.activityId] = {
            hotelInfos: responseDataOfActivity.hotelInfos,
            routeInfos: responseDataOfActivity.routeInfos
          };

          if (lackRouteData)
          {
            routeData = {};
            jQuery.each(responseRouteData, function(routeId) {
              var dataOfRoute = this;
              routeData[routeId] = { hotelLinkMap: dataOfRoute.hotelLinkMap, hotelInfoMap: dataOfRoute.hotelInfoMap };
            });

            routeDataBySupplierId[params.supplierId] = routeData;
            // This may actually overwrite earlier data (since we can have concurrent
            // requests with different activityId's but the same supplierId), but it's ok.
          }

          activityDeferred.resolve(true);
        });

        activityDeferredById[params.activityId] =  activityDeferred;
      }

      // 2.
      // Tell the user that we are waiting (if we actually are).

      if (activityDeferredById[params.activityId].state() == 'pending')
      {
        $hotelSelect.empty();
        $hotelSelect.append(jQuery("<option />").text('-- Loading --'));
        $hotelSelect.prop('disabled', true);
      }

      // 3.
      // Wait for loading to complete (or don't wait, if we already had data)
      // and then populate the hotels select.

      activityDeferredById[params.activityId].done(function() {
        initHotels(params.supplierId, params.activityId, params.agencyId, $hotelSelect, params.routeSelectionContextData);
        $hotelSelect.prop('disabled', false);
      });
    },

    setupTransportationRoutes: function(params) {
      // params: { supplierId, activityId, agencyId, hotelId, routeSelectionContextData }

      var contextData = params.routeSelectionContextData;

      jQuery(contextData.routesContainerSelector).hide();
      jQuery.each(contextData.routeSelectorMap, function(transportationRouteId, routeSelector) {
        if (!routeSelector)
          return;
        jQuery(routeSelector).hide();
      });

      if (!params.hotelId)
        return;

      var dataOfActivity = dataOfActivityById[params.activityId];
      var routeData = routeDataBySupplierId[params.supplierId];

      // @DEBUG
      //console.log('dataOfActivity: ' + JSON.stringify(dataOfActivity));
      //console.log('routeData: ' + JSON.stringify(routeData));
  
      var haveRouteSelection = false;
      jQuery.each(dataOfActivity.routeInfos, function(index, routeInfo) {
        if (params.agencyId != 0 && !routeInfo.agencyEnabled)
          return;

        if (routeData[routeInfo.id])
        {
          // If this supplier ever has any custom information on this route...
          var pickupHotelId = routeData[routeInfo.id].hotelLinkMap[params.hotelId] || params.hotelId;

          var routeInfoForHotel = routeData[routeInfo.id].hotelInfoMap[pickupHotelId];
          if (routeInfoForHotel)
          {
            if (routeInfoForHotel.notServicing)
              return;
            routeInfo = jQuery.extend({}, routeInfo, routeInfoForHotel);
          }
        }

        console.log(' > ELA looking for routeInfo.id: ' + routeInfo.id);
        var routeElementSelector = contextData.routeSelectorMap[routeInfo.id];
        if (routeElementSelector)
        {
          console.log(' > ELA showing selector: ' + routeElementSelector);
          jQuery(routeElementSelector).show();
          haveRouteSelection = true;
        }
      });

      if (haveRouteSelection)
      {
        jQuery(contextData.routesContainerSelector).show();
      }
    }
  };

  return m;
})();

var accommodation_loadHotels = Accommodation.loadHotels;
var accommodation_setupTransportationRoutes = Accommodation.setupTransportationRoutes;
