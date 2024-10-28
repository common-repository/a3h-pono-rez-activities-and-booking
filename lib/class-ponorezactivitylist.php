<?php
/**
 * Handle huge activity lists
 *
 * This helper class does SOAP calls to fetch the activity list, then
 * provides methods to filter by search term, perform pagination, and
 * other useful tools. It should also do caching, because the activity
 * list can be really huge.
 *
 * @package PonoRezActivityList
 * @version 1.0
 * @author Erik L. Arneson <earneson@arnesonium.com>
 */

final class PonoRezActivityList {
    protected $psc;
    protected $_activityList;
    protected $_serviceCreds;

    // Public variables used to hold good information.
    public $totalCount = 0;
    public $currentPage = 0;
    public $resultsPerPage = 20;
    public $maxPage = 0;

    /**
     * Create an activity list object
     */
    public function __construct($psc, $serviceCreds) {
        $this->psc = $psc;
        $this->_serviceCreds = $serviceCreds;
    }

    public function prevPage () {
        $prev = $this->currentPage - 1;

        if ($prev <= 0)
            $prev = 1;

        return $prev;
    }

    public function nextPage () {
        $next = $this->currentPage + 1;

        if ($next > $this->maxPage)
            $next = $this->maxPage;

        return $next;
    }
              
    
    /**
     * Get a list of items to display based on options
     *
     * Keys in the $options array include:
     * filter : search text (default null)
     * page : page number (default 1)
     * count : number of items per page (default 20)
     */
    public function displayItems($options = array()) {
        if (!isset($options['page']))
            $options['page'] = 1;

        if (!isset($options['count']))
            $options['count'] = 20;

        if (isset($options['filter']) && 0 < strlen($options['filter'])) {
            $aList = $this->_filterByKeyword($options['filter']);
        }
        else {
            $aList = $this->_activityList();
        }

        // Internal records are good for us.
        $this->totalCount = count($aList);
        $this->currentPage = $options['page'];
        $this->resultsPerPage = $options['count'];
        $this->maxPage = round(($this->totalCount / $options['count']) + 0.5, 0);

        return $this->_getPageNumber($aList, $options['page'], $options['count']);
    }

    private function _activityList() {
        if (!isset($this->_activityList)) {
            $this->_activityList = $this->psc->getActivities(array('serviceLogin' => $this->_serviceCreds))
                                 ->return;
        }

        return $this->_activityList;
    }

    private function _filterByKeyword($searchString) {
        // Get search strings, lower cased.
        $keywords = explode(' ', strtolower($searchString));
        $filteredList = array();
        
        foreach ($this->_activityList() as $a) {
            // Build our string to search against.
            $srchText = strtolower(implode(' ', array($a->name,
                                                      $a->island,
                                                      $a->description,
                                                      $a->notes,
                                                      $a->times,
                                                      $a->directions)));

            // For each keyword, check the srchText variable. If not
            // found, do a 'continue 2' to break out of this loop and
            // on to the next activity.
            foreach ($keywords as $kw) {
                if (FALSE === strpos($srchText, $kw)) {
                    continue 2;
                }
            }

            // If we made it here, every search term was found. Add to our list.
            $filteredList[] = $a;
        }

        // We now have a filtered list.
        return $filteredList;
    }

    /**
     * Returns a number of items per page.
     */
    private function _getPageNumber (&$list, $pageNo, $itemsPerPage = 20) {
        $startIdx = ($pageNo - 1) * $itemsPerPage;

        return array_slice($list, $startIdx, $itemsPerPage);
    }
}
