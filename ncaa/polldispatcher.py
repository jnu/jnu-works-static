#!/var/chroot/home/content/41/10223541/html/python/bin/python
# -*- coding: utf8 -*-
'''
$ python ncaa2013/web/polldispatcher.py

Decide whether to run poller.

Copyright (c) 2013 Joe Nudell
Freely distributable under the MIT License.
'''

import cgi
import json
import os
from ncaalib.ncaa import *


# Get GET
args = cgi.FieldStorage()

ret = dict()


