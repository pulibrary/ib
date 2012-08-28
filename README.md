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

Web Server Configuration
-------------
If you are using Apache as your webserver, add the following code to your VirtualHost file:
``` 
    WSGIDaemonProcess ib user=shaune group=shaune processes=2 threads=5
    WSGIScriptAlias /ib /home/shaune/workspace/ib/ib.wsgi

    <Directory /home/shaune/workspace/ib>
        WSGIProcessGroup ib
        WSGIApplicationGroup %{GLOBAL}
        Order allow,deny
        Allow from all
    </Directory>

```

ib should then be accessible at http://yourhostname/ib

Debugging
---------
Running the module (`python ./ib.py`) will start a dev. server on port 5000.

Logging
-------
Levels, etc. are set in `ib.conf`. Note that logs must be writable by the webserver.  If they are not, you will get an Ineternal Server Error (500).
