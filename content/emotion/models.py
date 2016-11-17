# -*- coding: utf8 -*-
'''
models.py

Module providing a wrapper class for an NLTK model.
Wrapper stores information about preprocessing steps and feature
extraction in order to transduce input text for classification
into featureset, which is finally passed to the classifier.

Model

METHODS
    Model.get_features(text)      return featureset from text
    Model.classify(text)          extract features and classify text.
                                  returns Classifier.classify value
    Model.prob_classify(text)     extract features and classify text,
                                  returning probability distribution.


NOTES
Model class is fully picklable. All the transformation steps
and feature extraction functions passed on init will be recreated
when the instance is unpickled.

IMPORTANT If any of the aforementioned external functions have
dependencies (e.g., nltk.corpus.stopwords), the function itself
MUST HANDLE THESE DEPENDENCIES, or else they must be handled
manually in the destination program.

Copyright (c) 2013 Joseph Nudell
'''
__author__ = "Joseph Nudell (joenudell@gmail.com / @joenudell"
__date__ = "Jan 24, 2013"


import marshal
import types


class Model(object):
    '''Store classifier and transformations'''
    def __init__(self, classifier, transformations, features, extractor):
        self.classifier = classifier
        self.features = features
        self.transformations = transformations
        self.extractor = extractor
    
    def __getstate__(self):
        m = self.__dict__.copy()
        m['__frozen'] = {
            'transformations' : [marshal.dumps(f.func_code) for f in self.transformations],
            'extractor' : marshal.dumps(self.extractor.func_code)
        }
        del m['transformations']
        del m['extractor']
        return m

    def __setstate__(self, d):
        self.__dict__ = d
        self.transformations = []
        i = 0
        for t in d['__frozen']['transformations']:
            name = "transformation%d"%i
            i += 1
            code = marshal.loads(t)
            self.transformations.append(types.FunctionType(code, globals(), name))
        self.extractor = types.FunctionType(marshal.loads(d['__frozen']['extractor']), globals(), 'extractor')
        delattr(self, '__frozen')

    def get_features(self, text):
        for transformation in self.transformations:
            text = transformation(text)
        features = self.extractor(text, self.features)
        return features

    def prob_classify(self, text):
        return self.classifier.prob_classify(self.get_features(text))
    
    def classify(self, text):
        '''Classify text according to model'''
        return self.classifier.classify(self.get_features(text))