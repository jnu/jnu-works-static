'''
$ python person.py

Library defining basic classes of Human Beings, as well as defining
brains, minds, as well as simple interactions.

CLASSES

Being
    Human
        Person
            Memory
        

Interaction
    Conversation
    Relationship




ABOUT

Copyright (c) 2013 Joseph Nudell.
'''
from datetime import datetime
from collections import deque, defaultdict, OrderedDict

# -- Parameters --------------------------- //
DEBUG = True




# -- Setup -------------------------------- //
if DEBUG:
    from sys import stderr




# -- Classes ------------------------------ //
# Abstract
class Event(object):
    def __make_handlers(self):
        self.__handlers = defaultdict(list)

    def signal(self, event, *args, **kwargs):
        if not self.__dict__.has_key('_Event__handlers'):
            self.__make_handlers()

        for handler in self.__handlers[event]:
            handler(*args, **kwargs)

    def handle(self, signal, handler):
        '''Install event handler on signal'''
        if not self.__dict__.has_key('_Event__handlers'):
            self.__make_handlers()

        self.__handlers[signal].append(handler)

    def unhandle(self, signal, handler=None):
        '''Uninstall event handler on signal; if handler=None uninstall ALL'''
        if not self.__dict__.has_key('_Event__handlers'):
            self.__make_handlers()

        if handler is not None:
            self.__handlers[signal].remove(handler)
        else:
            self.__handlers = []

    def __setitem__(self, key, value):
        '''Aliases to self.handle_signal(key, value)'''
        self.handle(key, value)


class Input(Event):
    pass



# Ambience
class TheVoid(Input):
    def __init__(self):
        self.ID = 'thevoid'
        self.__events = OrderedDict()
    
    def submit(self, data, source, target_pool=None):
        if target_pool is None:
            target_pool = self
        date = datetime.today()
        self.__events[date] = (date, data, source, target_pool,)
        self.signal('sound', data, source=source, target_pool=target_pool)

air = TheVoid()



# Entities
class Being(object):
    def __init__(self, ID=None):
        # States
        self.awake = False
        if ID is None:
            ID = id(self)
        self.ID = ID


class Human(Being):
    def __init__(self, ID=None):
        global air

        # Init super
        super(Human, self).__init__(ID) # SUPER HUMAN SELF INIT!

        # Physical Properties
        self.sex = None
        self.gender = None
        self.hair = { 'color' : None }
        self.eye = {'color' : None }
        self.height = None
        self.weight = None

        # Sensory inputs
        self.ear = Ear(self, self.hear)
        self.eye = Eye(self, self.see)
        self.mouth = Mouth(self, self.taste)
        self.skin = Skin(self, self.touch)
        self.nose = Nose(self, self.smell)

        # Attune the senses to the surrounding
        self.pay_attention(air)

    # Sensory handlers
    def hear(self):
        # Auditory sensory handler
        data = self.ear.pop()
        if DEBUG:
            source = ''
            if isinstance(self.attention.subject, TheVoid):
                source = 'out of the blue'
            elif isinstance(self.attention.subject, Conversation):
                source = 'in their conversation'
            else:
                source = 'from somewhere unknown ... ?'
            s = "%s heard \"%s\" from %s %s" % \
                    (self.ID, data[0], data[1].ID, source)
            print >>stderr, s

        if data[2] != self.attention.subject:
            # Not currently paying attention to incoming data source
            ## TODO Logic to determine when to pay attention
            ## versus when to block source
            ## Right now just switch attention to incoming data
            self.pay_attention(data[2])

    def taste(self):
        data = self.mouth.pop()
        print self.ID + " tasted " + str(data)

    def touch(self):
        data = self.skin.pop()
        print self.ID + " felt " + str(data)

    def smell(self):
        data = self.nose.pop()
        print self.ID + " smelled " + str(data)
    
    def see(self):
        data = self.eye.pop()
        print self.ID + " saw " + str(data)

    # MENTAL primitives
    def pay_attention(self, obj):
        self.awake = True
        self.attention = PointOfView(obj)
        self.ear.listen_to(self.attention)
        #self.mouth.__
        #self.skin.__
        #self.nose.__
        #self.eye.__
        if DEBUG:
            target = ''
            if isinstance(obj, TheVoid):
                target = 'the world'
            elif isinstance(obj, Conversation):
                target = 'a conversation'
            s = "%s started paying attention to %s" % (self.ID, target)
            print >>stderr, s
                        
    # ACTION primitives
    def say(self, message, target=None):
        '''Submit message to `target`, creating a new conversation if the
        target is a person.'''
        if target is None:
            target = self.attention
        if isinstance(target, Person):
            self.pay_attention(Conversation(self, target))
        target = self.attention
        self.ear.listen_to(target)
        target.submit(message, self)


class Person(Human):
    def __init__(self, ID=None):
        # Init super
        super(Person, self).__init__(ID)

        # Personality
        ## For now, using the Myers-Briggs Type Indicator
        ## Domain: [-1, 1]; -1 is I,N,F,P // 1 is E,S,T,J
        self.attitute = 0
        self.perception = 0
        self.judgement = 0
        self.lifestyle = 0

        # Name
        self.name = {
            'title'  : '',
            'first'  : '',
            'middle' : '',
            'last'   : '',
            'suffix' : ''
        }
        # Memories
        self.memories = []

        # Disposition
        self.disposition = Disposition()



# Sensory inputs
class SensoryInput(Event):
    def __init__(self, master, handler):
        self.__queue = deque()
        self.__master = master
        self.__handler = handler
        self['new_data'] = handler

    def pop(self):
        return self.__queue.popleft()

    def absorb(self, data, source=None, target_pool=None):
        if source is None or source.ID != self.__master.ID:
            self += (data, source, target_pool,)

    def __iadd__(self, data):
        self.__queue.append(data)
        self.signal('new_data')


class Ear(SensoryInput):
    def __init__(self, master, handler):
        self.target = None
        self.__default_signal = 'sound'
        super(Ear, self).__init__(master, handler)

    def listen_to(self, target, signal=None):
        global air
        if signal is None:
            signal = self.__default_signal

        if self.target is not None:
            # Remove self from current target
            self.target.unhandle(signal, self.absorb)

        if target is None:
            target = air

        if isinstance(target, PointOfView):
            target = target.subject

        self.target = target

        target.handle(signal, self.absorb)


class Mouth(SensoryInput):
    pass


class Eye(SensoryInput):
    pass


class Skin(SensoryInput):
    pass


class Nose(SensoryInput):
    pass


# Not sure how this fits in yet
class Memory(object):
    def __init__(self):
        self.kind = None
        self.relationship = None
        self.information = []
        self.experiences = { 'conversations' : [] }



# Emotions
class Disposition(object):
    pass


class Relationship(object):
    def __init__(self, target):
        # Defines the relationship of smtg towards `target`
        # Everything on the domain [0, 1]
        self.familiarity = 0
        self.attraction = 0
        self.intrigue = 0
        self.trust = 0
        self.intimacy = 0



# Interactions
class Interaction(Input):
    def __init__(self, *args):
        self.setting = None
        self.start_time = datetime.today()
        self.parties = args


class PointOfView(object):
    def __init__(self, subject):
        # Subject of point of view
        self.subject = subject

        # Define emotive relational parameters, all on domain [-1,1]
        self.friendliness = 0
        self.respect = 0
        self.interest = 0
        self.comfort = 0
        self.tone = 0
    
    def submit(self, *args, **kwargs):
        # Pass along submit to self.subject
        return self.subject.submit(*args, **kwargs)


class Conversation(Interaction):
    def __init__(self, *args):
        # Physical parameters
        self.volume = .5

        # Transcript
        self.transcript = defaultdict(list)
        self.transcript['sequence'] = [] # Order of conversation

        # Add parties to conversation transcript (so they show up as keys)
        for arg in args:
            self.transcript[arg.ID] = []

        super(Conversation, self).__init__(*args)
        
    def submit(self, message, source):
        self.transcript[source.ID].append(message)
        self.transcript['sequence'].append(source.ID)
        self.signal('sound', message, source=source, target_pool=self)
       
        # Propogate conversation into air if loud enough 
        if self.volume > .1:
            global air
            air.submit(message, source, target_pool=self)
   





# -- Test Cases ----------------------------------------- //
if __name__=='__main__':
    # run tests
    from sys import stderr
    
    # (Show module import just for reference)
    print >>stderr, ">>> from world import *"

    test_code = '''# Test code

# Create people
joe = Person('joe')
tom = Person('tom')

# Start a conversation
joe.say('Hey, Tom!', tom)

# Respond
tom.say('Hey!')
'''
    
    for line in test_code.split('\n'):
        print >>stderr, ">>>", line
        exec line
