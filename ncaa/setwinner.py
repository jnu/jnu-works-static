#!/var/chroot/home/content/41/10223541/html/python/bin/python
# -*- coding: utf8 -*-
'''
$ python ncaa2013/web/setwinner.py

Controller: Set the winner and loser (and winner score and loser score) in the
database of a game in which the winner and loser played in the tournament in
the given season. Can be called via a manual view interface, or by polling
a server for this information. Persists data in database on server.

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

season = args.getvalue('season', None)
gameid = args.getvalue('gameid', None)
winnername = args.getvalue('winnername', None)
losername = args.getvalue('losername', None)
winnerscore = args.getvalue('winnerscore', None)
loserscore = args.getvalue('loserscore', None)


if season is None \
    or winnername is None or winnerscore is None \
    or losername is None or loserscore is None:
    ret['error'] = 'params not full'




if not ret.has_key('error'):
    # Connect to DB
    session = load_db('../../data/ncaa.db')


    # Get tournament
    t = session.query(Tournament).filter(Tournament.season==season).one()


    # Find winning squad and losing squad by name (fuzzy matching)
    try:
        ws = Squad.get(session, winnername, season)
        if ws is None:
            raise ValueError
    except:
        ret['error'] = "Can't find %s in DB" % winnername
    try:
        ls = Squad.get(session, losername, season)
        if ls is None:
            raise ValueError
    except:
        ret['error'] = "Can't find %s in DB" % losername

    if not ret.has_key('error'):

        # Find game in question
        if gameid is not None:
            g = t[int(gameid)]
        else:
            # Find game by opponents
            g = None
            for game in t:
                if ws in game.opponents and ls in game.opponents:
                    g = game
                    break



        if g is None:
            ret['error'] = "game not found"
        else:
            # Set team as winner of given game.
            wid = g.opponents.index(ws)
            g.winner = g.opponents[wid]
            g.loser = g.opponents[not wid]
            g.winner_score = int(winnerscore)
            g.loser_score = int(loserscore)
        
            # Find next game.
            nextgame = g.next()
        
            # Append winning team to next game as necessary
            if nextgame and ws not in nextgame.opponents:
                nextgame.opponents.append(ws)

            session.commit()

            ret['success'] = True


if ret.has_key('error'):
    ret['success'] = False




## RETURN ##
## HEADER ##
print "Content-type: application/json;charset=utf-8"
print
## CONTENT ##
print json.dumps(ret)







