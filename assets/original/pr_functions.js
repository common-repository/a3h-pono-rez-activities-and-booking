function external_urlEncode(clearString)
{
  if (typeof clearString == 'undefined') return '';
  var output = '';
  var x = 0;
  clearString = clearString.toString();
  var regex = /(^[a-zA-Z0-9_.]*)/;
  while (x < clearString.length)
  {
    var match = regex.exec(clearString.substr(x));
    if (match != null && match.length > 1 && match[1] != '')
    {
      output += match[1];
      x += match[1].length;
    }
    else
    {
      if (clearString[x] == ' ' || clearString.charCodeAt(x).toString(16).toUpperCase() == '20' || clearString.charCodeAt(x).toString(16).toUpperCase() == 'A0')
      {
        output += '+';
      }
      else
      {
        var charCode = clearString.charCodeAt(x);
        var hexVal = charCode.toString(16);
        output += '%' + ( hexVal.length < 2 ? '0' : '' ) + hexVal.toUpperCase();
      }
      x++;
    }
  }
  return output;
}

function external_trim(str)
{
  if (typeof(str) != 'string') return str;
  return str.replace(/^\s+|\s+$/g, '');
}

function checkpositivenumber(x)
{
	var anum=/^\d+$/;
	return anum.test(x);
}

function checkdate()
{
	if (document.getElementById('date').value.length == 0)
	{
		alert('Please select activity date');
		return false;
	}

	return true;
}

function checkupgrade(requested, toolate, limited, available, name)
{
  requested = external_trim(requested);
	if (!checkpositivenumber(requested))
	{
		alert('Please enter valid upgrade amount(s)');
		return false;
	}
  if (requested != 0 && toolate)
  {
    alert('Sorry, it\'s too late to book ' + name);
    return false;
  }
	if (limited && parseInt(requested) > available)
	{
		alert('Sorry, only ' + available + ' ' + name + '(s) available');
		return false;
	}
	return true;
}

var ismobileapp = false;
var isIframe = false;
var cancellationPolicyConfirmed = false;
var query = '';
var reservationmode = '';
var activitydate = '';
var googleanalyticsaccount = '';
var guestCountMap;
var mode2Setup;
var upgradeCountMap;

// (What does the next comment mean??? - @ELA)
// Deprecated but still supported:
var seats1;
var seats2;
var seats3;
var seats4;
var seats5;

// Works only after the upgrades page.
function setMobileApp()
{
  ismobileapp = true;
}

function setIframe()
{
  isIframe = true;
}

// These two functions can be called before reservtion_init():

function checkcancellation(cancellationpolicy)
{
  cancellationPolicyConfirmed = false;

  if (!cancellationpolicy.checked)
  {
    alert('You must check the box acknowledging reading & accepting our Terms & Conditions');
    return false;
  }

  cancellationPolicyConfirmed = true;
	return true;
}

function setCancellationPolicyConfirmed()
{
  cancellationPolicyConfirmed = true;
}

function reservation(dummy_referrerid, activityid, date, discountname, discountpercents)
{
  reservation_init(dummy_referrerid, activityid, date, discountname, discountpercents, 0.0, discountpercents, 0.0, discountpercents, 0.0, discountpercents, 0.0, discountpercents, 0.0, discountpercents, discountpercents, window.location.href);
}

function reservation2(dummy_referrerid, activityid, date, discountname, discountpercentage1, discountvalue1, discountpercentage2, discountvalue2, discountpercentage3, discountvalue3, discountpercentage4, discountvalue4, discountpercentage5, discountvalue5, discountpercentagetransportation, discountpercentageupgrades)
{
  reservation_init(dummy_referrerid, activityid, date, discountname, discountpercentage1, discountvalue1, discountpercentage2, discountvalue2, discountpercentage3, discountvalue3, discountpercentage4, discountvalue4, discountpercentage5, discountvalue5, discountpercentagetransportation, discountpercentageupgrades, window.location.href)
}

function reservation_init(dummy_referrerid, activityid, date, discountname, discountpercentage1, discountvalue1, discountpercentage2, discountvalue2, discountpercentage3, discountvalue3, discountpercentage4, discountvalue4, discountpercentage5, discountvalue5, discountpercentagetransportation, discountpercentageupgrades, referer)
{
  query =
    '&referer=' + external_urlEncode(referer) +
    '&activityid=' + external_urlEncode(activityid) +
    (date != undefined ? '&date=' + external_urlEncode(date) : '');
  reservationmode = '';
  activitydate = external_trim(date);
  guestCountMap = {};
  mode2Setup = false;
  upgradeCountMap = {};
  // Deprecated:
  seats1 = 0;
  seats2 = 0;
  seats3 = 0;
  seats4 = 0;
  seats5 = 0;
}

function setGiftCertificate()
{
  reservationmode = 'giftcertificate';
}

function addGuests(guestTypeId, guestCount)
{
  if (!mode2Setup)
  {
    query = query + '&externalpurchasemode=2';
    mode2Setup = true;
  }
  if (guestCount == 0)
  {
    return;
  }
  query = query + '&guests_t' + guestTypeId + '=' + external_urlEncode(external_trim(guestCount));
  guestCountMap[guestTypeId] = external_trim(guestCount);
}

function addUpgrades(upgradeId, upgradeCount)
{
  if (upgradeCount == 0) return;

  query = query + '&upgrades_u' + upgradeId + '=' + external_urlEncode(external_trim(upgradeCount));
  upgradeCountMap[upgradeId] = external_trim(upgradeCount);
}

function setUpgradesFixed()
{
  query = query + "&upgradesfixed=1";
}

function setHotel(hotelId)
{
  query = query + "&hotelid=" + external_urlEncode(hotelId);
}

function setRoom(room)
{
  query = query + "&room=" + external_urlEncode(external_trim(room));
}

function setTransportationRoute(transportationRouteId)
{
  query = query + "&transportationrouteid=" + external_urlEncode(transportationRouteId);
}

function setAccommodationFixed()
{
  query = query + "&accommodationfixed=1";
}

function setdiscount(discountcode)
{
  query = query + '&discountcode=' + external_urlEncode(discountcode);
}

function setagency(agencyid)
{
  query = query + '&agencyid=' + agencyid;
}

function setgoldcard(goldcardnumber)
{
  query = query + '&goldcardnumber=' + external_urlEncode(external_trim(goldcardnumber));
}

function setpromotionalcode(promotionalcode)
{
  query = query + '&promotionalcode=' + external_urlEncode(external_trim(promotionalcode));
}

function setpaylater(paylater)
{
  query = query + '&paylater=' + paylater;
}

function setlanguage(language)
{
  query = query + '&language=' + language;
}

function setgoogleanalytics(account)
{
  googleanalyticsaccount = account;
  query = query + '&googleanalyticsaccount=' + external_urlEncode(account);
}

// Deprecated but still supported.
function addseats1(seats, price, priceafterdiscount)
{
  query = query + '&seats1=' + external_urlEncode(external_trim(seats));
  seats1 = external_trim(seats);
}

function addseats2(seats, price, priceafterdiscount)
{
  query = query + '&seats2=' + external_urlEncode(external_trim(seats));
  seats2 = external_trim(seats);
}

function addseats3(seats, price, priceafterdiscount)
{
  query = query + '&seats3=' + external_urlEncode(external_trim(seats));
  seats3 = external_trim(seats);
}

function addseats4(seats, price, priceafterdiscount)
{
  query = query + '&seats4=' + external_urlEncode(external_trim(seats));
  seats4 = external_trim(seats);
}

function addseats5(seats, price, priceafterdiscount)
{
  query = query + '&seats5=' + external_urlEncode(external_trim(seats));
  seats5 = external_trim(seats);
}

function addseatsfromselect(select)
{
  var id = select.options[select.selectedIndex].value;
  if (id.match(/^t(\d+)$/))
  {
    var guestTypeId = RegExp.$1;
    addGuests(guestTypeId, 1);
  }
  else
  {
    query = query + '&seats' + id + '=1';
    if (id == '1') seats1 = 1;
    if (id == '2') seats2 = 1;
    if (id == '3') seats3 = 1;
    if (id == '4') seats4 = 1;
    if (id == '5') seats5 = 1;
  }
}

// Not supported, but may be used somewhere.
function addextras(name, amount, price, priceafterdiscount)
{
}

function getBaseUrl()
{
	var myName = /^(.*[\/\\])external\/functions\.js(?:\?|$)/;
	var scripts = document.getElementsByTagName("script");
	for (var i = 0; i < scripts.length; i++) {
		var src = scripts[i].src;
		if (src && src.match(myName)) {
			return RegExp.$1;
		}
	}

  return '';
}

function getJsVersion()
{
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; ++i)
  {
    if (scripts[i].src && /external\/functions.js\?(?:.*&)?jsversion=([^&]+)(?:&|$)/.test(scripts[i].src))
    {
      return RegExp.$1;
    }
  }

  return '';
}

var baseurl = 'https://www.hawaiifun.org/reservation/';
if (getBaseUrl().match(/^https?:\/\/[a-z]+[:\/]/) || getBaseUrl().match(/reservation_test/)) // single-word hostname
{
  baseurl = getBaseUrl();
}

var jsVersion = getJsVersion();

function external_additionalQueryParams()
{
  var params = '';
  if (cancellationPolicyConfirmed) params += '&policy=1';

  return params;
}

function availability_popup()
{
  if (!external_validateActivityInfo()) return;

  var action = 'AVAILABILITYCHECKPAGE';
  if (reservationmode == 'giftcertificate')
  {
    action = 'GIFTCERTIFICATESELECTUPGRADES';
  }

  var d=window.open('', '_blank', 'width=800,height=200,scrollbars=yes,resizable=yes,top=100,left=100').document;
  d.open("text/html", "replace");
  d.write("<html><head>"
    + "<script type='text/javascript'>var q='"+ query + external_additionalQueryParams() +"';</script>"
    + "<script type='text/javascript' src='"+ baseurl + "common/jquery/jquery-1.9.1.min.js'></script>"
    + "<script type='text/javascript' src='"+ baseurl + "external/functions.js?jsversion=" + jsVersion + "'></script>"
    + "<script type='text/javascript' src='"+ baseurl + 'externalservlet?action=' + action + query + external_additionalQueryParams() +"'></script>"
    + (googleanalyticsaccount == '' ? '' : "<script src='https://ssl.google-analytics.com/ga.js' type='text/javascript'></script><script type='text/javascript'>try { pageTracker = _gat._getTracker('" + googleanalyticsaccount + "'); pageTracker._setAllowLinker(true); pageTracker._setAllowHash(false); pageTracker._trackPageview(); } catch(err) {}</script>")
    + "</head><body onload='javascript:showContent();'><table width='100%' height=170><tr><td width=100% valign=center align=center><b>C h e c k i n g . . .</b></td></tr></table></body></html>");
  d.close();
}

function availability_iframe() {
  if (!external_validateActivityInfo()) return;

  var action = 'AVAILABILITYCHECKPAGE';
  if (reservationmode == 'giftcertificate')
  {
    action = 'GIFTCERTIFICATESELECTUPGRADES';
  }

  try {
    if (window.A3HE) {
      var a3heUrl = baseurl + 'externalservlet?action=' + action + '&iframe=1' + query + external_additionalQueryParams();

      //console.log('A3H URL: ' + a3heUrl);
      window.A3HE.open({ url: a3heUrl });
      return;
    }
  } catch(e) {}

  availability_popup();
}

function availability_iframe_popup() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);

  if (check) {
    availability_popup();
  } else {
    availability_iframe();
  }
}

function availability_page()
{
  if (!external_validateActivityInfo()) return;

  var action = 'AVAILABILITYCHECKPAGE';
  if (reservationmode == 'giftcertificate')
  {
    action = 'GIFTCERTIFICATESELECTUPGRADES';
  }

  window.document.location = baseurl + 'externalservlet?action=' + action + '&mobileapp=1' + query + external_additionalQueryParams();
}

function external_validateActivityInfo()
{
  if (!reservationmode)
  {
    // old-style reservation mode guessing
    var modefield = document.getElementById('mode');
    if(modefield != undefined) reservationmode = modefield.value;
  }

  if (!reservationmode) reservationmode = 'reservation';

  if (reservationmode == 'reservation' && activitydate == '')
  {
  	alert('Please select activity date');
  	return false;
  }
  var haveMode2Errors = false;
  var activeMode2GuestsTypes = 0;
  for (var guestTypeId in guestCountMap)
  {
    if (!guestCountMap.hasOwnProperty(guestTypeId)) continue;
    var guestCount = guestCountMap[guestTypeId];
    if (!checkpositivenumber(guestCount))
    {
      //haveMode2Errors = true;
      continue;
    }
    if (parseInt(guestCount) != 0)
    {
      activeMode2GuestsTypes++;
    }
  }

  if (0 == activeMode2GuestsTypes)
    haveMode2Errors = true;
  
  // seats1 etc. are deprecated
  if (haveMode2Errors || !checkpositivenumber(seats1) || !checkpositivenumber(seats2) || !checkpositivenumber(seats3)
      || !checkpositivenumber(seats4) || !checkpositivenumber(seats5)
      || (activeMode2GuestsTypes == 0 && parseInt(seats1) == 0 && parseInt(seats2) == 0
          && parseInt(seats3) == 0 && parseInt(seats4) == 0 && parseInt(seats5) == 0))
  {
	  alert('Please enter valid guests number(s)');
	  return false;
  }
  
  if (activeMode2GuestsTypes > 5)
  {
    alert('Sorry, you can\'t order seats for more than 5 different guest types');
    return false;
  }
  
  for (var upgradeId in upgradeCountMap)
  {
    if (!upgradeCountMap.hasOwnProperty(upgradeId)) continue;
    var upgradeCount = upgradeCountMap[upgradeId];
    if (!checkpositivenumber(upgradeCount))
    {
      alert('Please enter valid upgrades number(s)');
      return false;
    }
  }

  return true;
}

function purchase(transportationPreselected)
{
  var url = baseurl + 'externalservlet?action=EXTERNALPURCHASEPAGE' + (ismobileapp ? '&mobileapp=1' : '') + (isIframe ? '&iframe=1' : '') + '&mode=' + reservationmode + query + external_additionalQueryParams() + '&transportationpreselected=' + transportationPreselected;
  if (ismobileapp || isIframe)
  {
    window.document.location = url;
  }
  else
  {
    if (typeof pageTracker == 'undefined')
    {
      window.opener.document.location = url;
    }
    else
    {
      window.opener.document.location = pageTracker._getLinkerUrl(url);
    }
    window.close();
  }
}

function replacePage(html, cssArray)
{
  jQuery("body").html(html).css(cssArray);
}

window.A3HE = (function register_a3h_listener() {
  if(window.A3HE) return window.A3HE;

  function createElement(name, attributes) {
    attributes = attributes || {};
    var el = document.createElement(name);
    for(var attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        el[attr] = attributes[attr];
      }
    }
    return el;
  }

  function createExternalPurchaseFrame() {
    var externalpurchaseframecontainer = document.getElementById("external-purchase-frame-container");
    if (externalpurchaseframecontainer) return;

    var root = createElement("DIV", {id: "external-purchase-frame-container"});
    var el = createElement("LINK", {
      rel: "stylesheet",
      href: baseurl + "external/style/iframe.css"
    });
    root.appendChild(el);

    el = createElement("DIV", {id: "close"});
    el.innerHTML = '<a onclick="A3HE.close()">&times;</a>';
    root.appendChild(el);

    el = createElement("DIV", {id: "shadow"});
    root.appendChild(el);

    document.body.appendChild(root);
  }

  function open(message) {
    createExternalPurchaseFrame();

    //console.log('open', message);
    var url = message.url;
    var root = document.getElementById("external-purchase-frame-container");
    if (!root) return;

    if (url.indexOf("iframe=") == -1)
    {
      url = url + (url.indexOf("?") === -1 ? "?" : "&") + "iframe=1";
    }

    var iframe = document.getElementById("external-purchase-frame-container-iframe");

    root.className = 'showing';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (!iframe) {
      iframe = createElement("IFRAME", {
        id: "external-purchase-frame-container-iframe",
        frameBorder: 0,
        border: 0,
        width: "100%",
        src: url
      });
      iframe.style.opacity = 0;
      root.appendChild(iframe);
    }
    else {
      iframe.style.opacity = 0;
      iframe.src = url;
    }
  }

  function close(message) {
    //console.log('close', message);
    message = message || {};
    var root = document.getElementById("external-purchase-frame-container"), iframe = document.getElementById("external-purchase-frame-container-iframe");
    if (!root) { return; }
    root.className = '';
    if (iframe) { root.removeChild(iframe); }

    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (message.returnUrl) {
      window.location.href = message.returnUrl;
    }
  }

  function show(message) {
    var iframe = document.getElementById("external-purchase-frame-container-iframe");
    if (iframe) {
      iframe.style.opacity = '';
    }
  }

  var disallowIframe = !window.JSON || !window.addEventListener;
  if (disallowIframe) return null;

  //createExternalPurchaseFrame();

  var processors = {};
  //processors['a3h:open'] = open;
  processors['a3h:close'] = close;
  processors['a3h:show'] = show;

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent",
      eventer = window[eventMethod],
      messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

  eventer(messageEvent, function(e) {
    if (e.origin !== 'https://www.hawaiifun.org') {
      return;
    }
    try {
      var message = JSON.parse(e.message || e.data), processor;
      if (message && message.event) {
        processor = processors[message.event];
      }
      if (processor) {
        processor(message);
      }
    } catch (e) {
    }
  }, false);

  return {
    open: open,
    close: close
  };
})();

window.A3H = (function() {
  if (window.A3H) return window.A3H;

  function postIt(message) {
    var t = window.opener || window.parent;
    t.postMessage(JSON.stringify(message), '*');
  }

  function close(returnUrl) {
    postIt({event: 'a3h:close', returnUrl: returnUrl});
  }

  function show() {
    postIt({event: 'a3h:show'});
  }

  return {
    close: close,
    show: show
  };
})();
