#!/usr/bin/env python
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

import urlparse



class Ib(object):
	def __init__(self, jp2_root, djatoka_url):
		self.jp2_root = jp2_root if jp2_root.endswith('/') else jp2_root + '/' # for consistent path hacking
		self.djatoka_url = djatoka_url

		template_path = os.path.join(os.path.dirname(__file__), 'templates')
		self.jinja_env = Environment(loader=FileSystemLoader(template_path), autoescape=True)

		self.jinja_env.globals['urn_to_djatoka_query'] = self.urn_to_djatoka_query

		self.url_map = Map([
			Rule('/', endpoint='page_from_dir'),
			Rule('/<path:fs_path>', endpoint='page_from_dir'),
			Rule('/<path:fs_path>.jp2', endpoint='get_jp2'), # Do we need  this, or is it all javascript?
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
				rel = '/' + abs_path[len(self.jp2_root):]	
				name = abs_path.split(os.sep)[-1]
				dirs.append(ImageDir(abs_path, rel, name))
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

	def on_page_from_dir(self, request, fs_path=None):
		img_dir = os.path.join(self.jp2_root, fs_path) if fs_path else self.jp2_root
		parent = '/' + '/'.join(fs_path.split('/')[:-1]) if fs_path else '/'
		sub_dirs = self.list_dirs(img_dir)
		jp2s = self.list_jp2s(img_dir)

		logr.debug('img_dir: ' + img_dir)
		logr.debug('parent: ' + parent)

		# return Response(fs_path)
		return self.render_template('standard_page.html',
			name=img_dir.split('/')[-1],
			title='Images for ' + img_dir,
			parent=parent,
			dirs=sub_dirs,
			jp2s=jp2s
		)

	def on_get_jp2(self, request, path):
		pass

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
	def __init__(self, abs_path, rel_path, name):
		self.abs_path = abs_path
		self.rel_path = rel_path
		self.name = name

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

	app = Ib(jp2_root=jp2_root, djatoka_url=djatoka_url)
	app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
		'/static':  os.path.join(os.path.dirname(__file__), 'static')
	})
	return app


if __name__ == '__main__':
	from werkzeug.serving import run_simple
	app = create_app()
	run_simple('localhost', 5000, app, use_debugger=True, use_reloader=True)