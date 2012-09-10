#!/usr/bin/env python
#-*- coding: utf-8 -*-
# ib.py

from jinja2 import Environment, FileSystemLoader
from werkzeug.exceptions import HTTPException, NotFound
from werkzeug.routing import Map, Rule
from werkzeug.utils import redirect
from werkzeug.wrappers import Request, Response
from werkzeug.wsgi import SharedDataMiddleware
import ConfigParser
import logging
import logging.config
import os
import re
import sqlite3 as sqlite
import urlparse

DB_NAME='ib.db'

class Ib(object):
	def __init__(self, jp2_root, djatoka_url, url_root, app_title):
		self.jp2_root = jp2_root if jp2_root.endswith('/') else jp2_root + '/' # for consistent path hacking
		self.djatoka_url = djatoka_url
		self.url_root = url_root if url_root.endswith('/') else url_root + '/'
		self.app_title = app_title

		self.db_path=os.path.join(os.path.dirname(__file__), DB_NAME)

		template_path = os.path.join(os.path.dirname(__file__), 'templates')
		self.jinja_env = Environment(loader=FileSystemLoader(template_path), autoescape=True)

		self.jinja_env.globals['urn_to_djatoka_query'] = self.urn_to_djatoka_query

		self.db_setup()

		self.url_map = Map([
			Rule('/', endpoint='page_from_dir'),
			Rule('/<path:fs_path>', endpoint='page_from_dir'),
			Rule('/c_map', endpoint='db_dump'),
#			Rule('/_headers', endpoint='list_headers'), # for debguging
		])
	

	def urn_to_djatoka_query(self, level, urn):
		q = self.djatoka_url
		q += '?url_ver=Z39.88-2004'
		q += '&rft_id=' + urn
		q += '&svc_id=info:lanl-repo/svc/getRegion'
		q += '&svc_val_fmt=info:ofi/fmt:kev:mtx:jpeg2000'
		q += '&svc.format=image/jpeg'
		q += '&svc.level=' + str(level)
		return q 


	def dispatch_request(self, request):
		adapter = self.url_map.bind_to_environ(request.environ)
		try:
			endpoint, values = adapter.match()
			return getattr(self, 'on_' + endpoint)(request, **values)
		except HTTPException, e:
			return e

	def list_dirs(self, img_dir):
		"""Leaves out hidden dirs
		@return a list of ImageDir objects
		"""
		dirs = []
		for d in os.listdir(img_dir):
			abs_path = os.path.join(img_dir, d)
			if not d.startswith('.') and os.path.isdir(abs_path):
				rel =  abs_path[len(self.jp2_root):]	
				name = abs_path.split(os.sep)[-1]
				component = self.db_get_row(rel)
				dirs.append(ImageDir(abs_path, rel, name, component))
		dirs.sort()
		return dirs

	def list_jp2s(self,img_dir):
		"""Leaves out hidden files and filters in jp2s by file extension. List
		contains URNs that can be used w/ Djatoka.
		"""
		jp2s = []
		for f in os.listdir(img_dir):
			abs_path = os.path.join(img_dir, f)
			if not f.startswith('.') and os.path.isfile(abs_path) and f.endswith('.jp2'):
				urn = abs_path.replace(self.jp2_root, 'urn:pudl:images:deliverable:')
				logr.debug(urn)
				# TODO: what do we want in this list exactly? Something that can
				# be used to resolve a jp2 w/ Djatoka (or patokah :) )
				jp2s.append(Image(urn, f))
		jp2s.sort()
		return jp2s

	def on_db_dump(self, request):
		con = sqlite.connect(self.db_path)
		with con:
			cur = con.cursor()
			cur.execute("select * from ImageDirs order by ImageDir")
			rows = cur.fetchall()
			resp = '#Image Dir\tComponent Path\tNote\n'
			for row in rows:
				component_path = row[1][len('http://findingaids.princeton.edu/collections/'):]
				sane_note = ' '.join(row[2].splitlines())
				resp += '%s\t%s\t%s\n' % (row[0], component_path, sane_note)
		return Response(resp, mimetype='text/plain')



	def on_page_from_dir(self, request, fs_path=None, error=''):
		img_dir = os.path.join(self.jp2_root, fs_path) if fs_path else self.jp2_root
		parent = '/'.join(fs_path.split('/')[:-1]) if fs_path else ''
		sub_dirs = self.list_dirs(img_dir)
		jp2s = self.list_jp2s(img_dir)
		this_page = img_dir[len(self.jp2_root):]

		name = img_dir.split('/')[-1] if fs_path else self.app_title
		title = 'Images of ' + this_page if fs_path else self.app_title

		logr.debug('img_dir: ' + img_dir)
		logr.debug('parent: ' + parent)
		logr.debug('this_page: ' + this_page)

		image_dir = this_page # the page in the image browser

		if request.method == 'POST':
			component_uri = request.form['component_uri']
			note = request.form['note']
			if not self.is_valid_uri(component_uri) and component_uri:
				error = 'Please enter a valid component URI. [' + component_uri + ']'
			else:
				self.db_put_row(image_dir, component_uri, note)
			# we capture the new data, and then what? stay on the page? redirect?

		else: # GET
			# TODO read from the db and pass (c_uri, note) two-tuples for
			# pre-propopulating the existing form
			component_uri, note = self.db_get_row(image_dir)[1:]
			if component_uri:
				logr.debug('Retrieved db record for ' + this_page)


		# return Response(fs_path)
		return self.render_template('standard_page.html',
			base=self.url_root,
			show_home=bool(fs_path),
			name=name,
			title=title,
			parent=parent,
			dirs=sub_dirs,
			jp2s=jp2s,
			component_uri=component_uri,
			note=note,
			this_page=this_page,
			error=error
		)

	def is_valid_uri(self, uri):
		return re.match('http://findingaids\.princeton\.edu/collections/[^/]+/c0\d+', uri)

	def db_setup(self):
		
		if not os.path.exists(self.db_path):
			con = sqlite.connect(self.db_path)
			try:
				cur = con.cursor()
				cur.execute("""create table if not exists 
					ImageDirs(
						ImageDir TEXT PRIMARY KEY,
						ComponentURI TEXT, 
						Note TEXT
					);""")
				con.commit()
				logr.info("Database created")
			except sqlite.Error, e:
				if con:
					con.rollback()
				logr.error(e.message())
				sys.exit(1)
			finally:
				if con:	con.close()

	def db_put_row(self, img_dir, component_uri='', note=''):
		con = sqlite.connect(self.db_path)
		# TODO: do we need error handling?
		# TODO: log success/fail
		with con:
			cur = con.cursor()
			cur.execute("select * from ImageDirs where ImageDir=?", (img_dir,))
			row = cur.fetchone()
			if row:
				q = "update ImageDirs set Note=?, ComponentURI=? where ImageDir=?"
				logr.debug(q)
				cur.execute(q, (note, component_uri, img_dir))
			else:
				q = "insert into ImageDirs values('%s','%s','%s')" % (img_dir, component_uri, note)
				logr.debug(q)
				cur.execute(q)

	def db_get_row(self, img_dir):
		con = sqlite.connect(self.db_path)
		with con:
			cur = con.cursor()
			cur.execute("select * from ImageDirs where ImageDir=?", (img_dir,)) # trailing ',' makes it a tuple
			row = cur.fetchone()

			return row if row else (img_dir, '', '')

	def on_list_headers(self, request):
		from werkzeug.datastructures import Headers
		
		body = '==== Request Headers ====\n'
		for k in request.headers.keys():
			body += '%s: %s\n' % (k, request.headers.get(k))
		body += '\n==== Headers from WSGI ====\n'
		for k in request.environ:
			body += '%s: %s\n' % (k, request.environ.get(k))
		resp = Response(body)
		resp.mimetype='text/plain'
		return resp

	def wsgi_app(self, environ, start_response):
		request = Request(environ)
		response = self.dispatch_request(request)
		return response(environ, start_response)

	def render_template(self, template_name, **context):
		t = self.jinja_env.get_template(template_name)
		return Response(t.render(context), mimetype='text/html')

	def __call__(self, environ, start_response):
		return self.wsgi_app(environ, start_response)

class ImageDir(object):
	"""Stuff we need to know about an image directory (gets passed to the 
		template engine).
	"""
	def __init__(self, abs_path, rel_path, name, component=""):
		self.abs_path = abs_path
		self.rel_path = rel_path
		self.name = name
		self.component = component

	def __lt__(self, other):
		"""Show python how to sort these"""
		return self.name < other.name

class Image(object):
	"""Stuff we need to know about an image (gets passed to the template 
		engine). 
	"""
	def __init__(self, urn, name):
		self.urn = urn
		self.name = name

	def __lt__(self, other):
		"""How to sort"""
		return self.name < other.name

def create_app():
	global logr

	# Set up logging
	conf_file = os.path.join(os.path.dirname(__file__), 'ib.conf')
	logging.config.fileConfig(conf_file)
	logr = logging.getLogger('ib')
	logr.info("Logging initialized")

	# Read the config file
	conf = ConfigParser.RawConfigParser()
	conf.read(conf_file)

	jp2_root = conf.get('paths', 'jp2_root')
	logr.info('jp2_root: ' + jp2_root)

	djatoka_url = conf.get('paths', 'djatoka_url')
	logr.info('djatoka_url: ' + djatoka_url)

	url_root = conf.get('paths', 'url_root')
	logr.info('url_root: ' + url_root)

	app_title = conf.get('app', 'name')

	app = Ib(jp2_root=jp2_root, djatoka_url=djatoka_url, url_root=url_root, app_title=app_title)
	app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
		'/static':  os.path.join(os.path.dirname(__file__), 'static')
	})
	return app


if __name__ == '__main__':
	from werkzeug.serving import run_simple
	app = create_app()
	run_simple('localhost', 5000, app, use_debugger=True, use_reloader=True)