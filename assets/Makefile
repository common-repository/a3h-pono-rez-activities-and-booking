# -*- makefile -*-
#
# Original JavaScript files are kept in the original/ directory. These are just the minified versions.

YC=yui-compressor
OUTJS: pr_accommodation.min.js  pr_admin.min.js  pr_calendar.min.js  pr_document.min.js  pr_functions.min.js  pr_group_functions.min.js

%.min.js: original/%.js
	$(YC) -o $@ $?

all:	$(OUTJS)

