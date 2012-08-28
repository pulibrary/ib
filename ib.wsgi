#!/usr/bin/env python

#sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

#sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

import os, sys
#sys.path.insert(0, '/home/shaune/workspace/ib')
#import os, sys; sys.path.append(os.path.dirname(__file__))
import os, sys; sys.path.append('/home/shaune/workspace/ib')
#sys.path.insert(0, '/home/shaune/workspace/wsgi-test')

from ib import create_app
application = create_app()

#import wsgi-test


