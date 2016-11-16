#!/usr/bin/python
# -*- coding: utf8 -*-
import cgi
import cgitb
import os
import json
cgitb.enable()

form = cgi.FieldStorage()
classifier = form.getvalue('c', None)
message = form.getvalue('m', None)

if os.path.exists("models/%s.pickle"%classifier):
    classifier = "models/%s.pickle"%classifier
else:
    classifier = None

output = {}

if classifier is not None and message is not None:
    from models import Model
    import pickle
    
    with open(classifier, 'rb') as fh:
        model = pickle.load(fh)

    res = model.prob_classify(message)
    ol = {}
    for sample in res.samples():
        ol[sample] = res.prob(sample)
    output['result'] = ol
else:
    output['error'] = {'code':0, 'message':'No data'}

print "Content-Type: application/json;charset=utf-8"
print

print json.dumps(output)
