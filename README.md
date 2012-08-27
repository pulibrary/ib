ib
==

Browse A filesystem containing JPEG 2000 images.

Dependencies
------------
Werkzeug and Jinja2 are required. Both are available in apt:

	apt-get install python-werkzeug python-jinja2

Configuration
-------------
Set the two properties at the top of `ib.conf`. The application assumes that 
Djatoka is set up with our production resolver.

Debugging
---------
Running the module (`python ./ib.py`) will start a dev. server on port 5000.

Logging
-------
Levels, etc. are set in `ib.conf`.