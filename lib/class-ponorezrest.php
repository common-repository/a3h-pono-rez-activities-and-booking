<?php
/**
 * Wrapper for REST API on PonoRez. Eventually we may move away from
 * SOAP entirely, but for now this is for those places where the SOAP
 * interface isn't good enough.
 */

define('PR_SUPPLIER_REST_URI', 'https://www.hawaiifun.org/reservation_test/webapi/2012-05-10/public');

//PRODUCTION: https://www.hawaiifun.org/reservation/webapi/2012-05-10/public/suppliers/128/activities/1922/guestTypes?date=2015-12-22
//TEST SYSTEM: https://www.hawaiifun.org/reservation_test/webapi/2012-05-10/public/suppliers/128/activities/1922/guestTypes?date=2015-12-22 

final class PonoRezRest {

    // Access a REST API call.
    private function _callAPI($method, $url, $data = false)
    {
        $curl = curl_init();

        switch ($method)
        {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);

            if ($data)
                curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
            break;
        case "PUT":
            curl_setopt($curl, CURLOPT_PUT, 1);
            break;
        default:
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
        }

        $url = PR_SUPPLIER_REST_URI . $url;

        // Optional Authentication:
        //curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        //curl_setopt($curl, CURLOPT_USERPWD, "username:password");

        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

        $result = curl_exec($curl);

        curl_close($curl);

        return array('url' => $url,
                     'result' => $result);
        
    }
    
    public function getGuestTypes ($activity, $date) {
        $url = sprintf('/suppliers/%d/activities/%d/guestTypes',
                       $activity->supplierId,
                       $activity->id);

        $guestTypes = $this->_callAPI('GET', $url, array('date' => $date->format('Y-m-d')));

        return $guestTypes;
    }
}
