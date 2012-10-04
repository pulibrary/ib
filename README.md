ib
==

Browse A filesystem containing JPEG 2000 images.

Dependencies
------------
Werkzeug, Jinja2, and Sqlite3 are required. All are available in apt:

	apt-get install python-werkzeug python-jinja2 sqlite3 libsqlite3-dev

Configuration
-------------
Set the three properties at the top of `ib.conf`. The application assumes that 
Djatoka is set up with our production resolver.

Web Server Configuration
-------------
If you are using Apache as your webserver, add the following code to your 
VirtualHost file:

``` 
    WSGIDaemonProcess ib user=[webserver user] group=[webserver user] processes=2 threads=5
    WSGIScriptAlias /ib /path/to/ib/ib.wsgi
    WSGIProcessGroup ib

```

ib should then be accessible at http://yourhostname/ib

In production you should create a user for the application to run under, e.g.

```useradd -d /path/to/ib_app -s /sbin/false ib```

Debugging
---------
Running the module (`python ./ib.py`) will start a dev. server on port 5000.

Logging
-------
Levels, etc. are set in `ib.conf`. Note that logs must be writable by the webserver. If they are not, you will get an Ineternal Server Error (500).

Backup Options
-------
[This shell script](https://gist.github.com/3835123) can be used to backup the sqlite3 database.
