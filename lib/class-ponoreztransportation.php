<?php
/**
 * Helper class for Transportation mapping and layout
 *
 * This class is used by both the single-tour template class and the
 * group class to build and layout transportation information.
 * It is adapted from changes originally added to the PonoRezGroup class.
 *
 * @author Erik L. Arneson <earneson@arnesonium.com>
 */

final class PonoRezTransportation {
    protected $_transportationMap = null;
    protected $_transportationOptions = null;
    protected $_transportationOptionsSoap = null;
    protected $_supplierId;
    protected $_activityId;

    /**
     * Create a transportation object
     *
     * @param int $supplierId
     * @param int $activityId
     */
    public function __construct ($supplierId, $activityId) {
        if (null == $supplierId) {
            throw new Exception ("Cannot create PonoRezTransportation with invalid supplierId ($supplierId)");
        }

        if (null == $activityId) {
            throw new Exception ("Cannot create PonoRezTransportation with invalid activityId ($activityId)");
        }
        
        $this->_supplierId = $supplierId;
        $this->_activityId = $activityId;
    }

    /**
     * Grab the transportation ID from its "idCode"
     *
     * See documentation on 'type TransportationOption' for more
     * information. The idCode usually looks like A:301, where the "A"
     * is for some internal function and the "301" is the
     * transportation route ID.
     *
     * @param string $idCode
     * @return int Transportation route ID
     */
    public function idFromIdCode ($idCode) {
        return substr($idCode, strpos($idCode, ':') + 1);
    }

    public function cmpIdCode ($id, $idCode) {
        return (substr($idCode, strpos($idCode, ':') + 1) == $id);
    }
    
    /**
     * Accessor for the transportation map
     *
     * This function builds the transportation map if needed.
     *
     * @return array Transportation map
     */
    public function getTransportationMap () {
        if (null == $this->_transportationMap) {
            $this->_transportationMap = $this->_buildTransportationMap();
        }

        return $this->_transportationMap;
    }

    /**
     * List transportation options.
     *
     * This might trigger a SOAP call.
     *
     * @return TransportationRouteInfo array Undocumented SOAP class array
     */
    public function getTransportationOptions () {
        if (null == $this->_transportationOptions) {
            $this->_transportationOptions = $this->_getTransportationOptions();
        }

        return $this->_transportationOptions;
    }

    /**
     * Return the name of a route by id
     *
     * Pass in a route ID, and get the name. For some reason, the
     * transportation options don't contain the simple name of the
     * option. That requires a separate SOAP call. Painful, isn't it?
     */
    public function routeNameById ($id) {
        $serviceCreds = PR()->serviceLogin();
        $service = PR()->providerService();
        $name = '';

        // I don't know if this is correct behavior, but if the SOAP
        // call fails, then we grab info from the option map, which
        // has a "description" field.
        try {
            $result = $service->getTransportationRoute(array(
                'serviceLogin' => $serviceCreds,
                'supplierId' => $this->_supplierId,
                'transportationRouteId' => $id
            ));

            $name = $result->return->name;
        }
        catch (Exception $e) {
            // Don't report the error. Look for another way.
            foreach ($this->getTransportationOptions() as $option) {
                if ($this->cmpIdCode($id, $option->idCode)) {
                    $name = $option->description;
                    break;
                }
            }
        }

        return $name;
    }
    
    /**
     * Collect transportation information from PR SOAP service
     *
     * At the moment it doesn't catch SOAP exceptions, leaving that to
     * be done by a caller function. I do not know if that is the
     * best behavior.
     *
     * @TODO I can't get transportation options for the current day for some reason.
     * @TODO Catch SOAP exceptions?
     */
    protected function _getTransportationOptionsSoap() {
        if (null !== $this->_transportationOptionsSoap)
            return $this->_transportationOptionsSoap;
        
        $serviceCreds = PR()->serviceLogin();
        $service = PR()->providerService();

        // Note that transportation routes aren't available in the Agency service for some reason.
        //$this->_transportationOptionsSoap
        $result = $service->getActivityTransportationOptions(array(
            'serviceLogin' => $serviceCreds,
            'supplierId'   => $this->_supplierId,
            'activityId'   => $this->_activityId,
            'date'         => new SoapVar(date('Y-m-d', strtotime('+20 days')), XSD_DATE)
        ));

        return ($this->_transportationOptionsSoap = $result);
    }

    protected function _getTransportationOptions () {
        if (null !== $this->_transportationOptions)
            return $this->_transportationOptions;
        
        $tMapItems = $this->_getTransportationMappingItems();

        // Each record in $tMapItems looks like this:
        //
        // [0] => stdClass Object
        //     (
        //         [stayingAtHotelId] => 898
        //         [transportationRouteId] => 355
        //         [transportationOptionIdCode] => C:133611
        //     )
        //
        // Our goal is to extract the unique set of transportationRouteId values and get the names for them.

        $tIds = array();
        foreach ($tMapItems as $item) {
            array_push($tIds, $item->transportationRouteId);
        }
        $tIds = array_unique($tIds);

        $this->_transportationOptions = array();
        foreach ($tIds as $id) {
            $this->_transportationOptions[$id] = $this->routeNameById($id);
        }

        return $this->_transportationOptions;
        
    }

    protected function _getTransportationMappingItems () {
        $toSoap = $this->_getTransportationOptionsSoap();

        if (isset($toSoap->out_transportationMappingItems))
            return $toSoap->out_transportationMappingItems;

        return array();
    }

    /**
     * Build transportation map from SOAP data
     *
     * This function builds the internal transportation map using the
     * PR SOAP service. This map will eventually then be turned into
     * JavaScript code for the frontend.
     */
    protected function _buildTransportationMap () {
        $tMapItems = $this->_getTransportationMappingItems();

        $tIds = $this->getTransportationOptions();

        $map = array();
        foreach ($tIds as $id => $itemName) {
            $map[$id] = sprintf('#transportationRouteContainer_a%d_%d',
                                $this->_activityId, $id);
        }

        // The map needs contain the following elements.
        //  routesContainerSelector: "#transportationRoutesContainer_a7648",
        //  routeSelectorMap: 
        $rval['routesContainerSelector'] = sprintf('#transportationRoutesContainer_a%d',
                                                   $this->_activityId);
        $rval['routeSelectorMap'] = $map;
        
        return $rval;
    }


}